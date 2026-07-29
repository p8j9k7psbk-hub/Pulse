/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_JWK: string;
  VAPID_SUBJECT: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const encoder = new TextEncoder();

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("origin") || "";
  const configured = (env.ALLOWED_ORIGINS || "https://p8j9k7psbk-hub.github.io,https://pulse-private-space.q6r6nrp7qy.chatgpt.site,http://localhost:3000")
    .split(",")
    .map((value) => value.trim());
  return {
    "access-control-allow-origin": configured.includes(origin) ? origin : configured[0],
    "access-control-allow-headers": "content-type,x-api-key,x-rune-device,x-rune-token",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function json(request: Request, env: Env, body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders(request, env) });
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlJson(value: unknown) {
  return base64Url(encoder.encode(JSON.stringify(value)));
}

async function vapidAuthorization(endpoint: string, env: Env) {
  const audience = new URL(endpoint).origin;
  const header = base64UrlJson({ typ: "JWT", alg: "ES256" });
  const payload = base64UrlJson({ aud: audience, exp: Math.floor(Date.now() / 1000) + 43_200, sub: env.VAPID_SUBJECT });
  const unsigned = `${header}.${payload}`;
  const key = await crypto.subtle.importKey("jwk", JSON.parse(env.VAPID_PRIVATE_JWK), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(unsigned));
  return `vapid t=${unsigned}.${base64Url(new Uint8Array(signature))}, k=${env.VAPID_PUBLIC_KEY}`;
}

async function sendEmptyPush(endpoint: string, env: Env) {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: await vapidAuthorization(endpoint, env),
      ttl: "60",
      urgency: "normal",
    },
  });
}

async function authenticate(request: Request, env: Env) {
  const deviceId = request.headers.get("x-rune-device") || "";
  const token = request.headers.get("x-rune-token") || "";
  if (!deviceId || !token) return null;
  const row = await env.DB.prepare("SELECT token_hash FROM devices WHERE id = ?").bind(deviceId).first<{ token_hash: string }>();
  if (!row) return null;
  const [provided, expected] = await Promise.all([sha256(token), Promise.resolve(row.token_hash)]);
  const valid = crypto.subtle.timingSafeEqual(encoder.encode(provided), encoder.encode(expected));
  return valid ? deviceId : null;
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  if (url.pathname === "/api/health") return json(request, env, { ok: true, service: "rune" });
  if (url.pathname === "/api/push/key") return json(request, env, { publicKey: env.VAPID_PUBLIC_KEY });

  if (url.pathname === "/api/devices" && request.method === "POST") {
    const id = crypto.randomUUID();
    const token = randomToken();
    await env.DB.prepare("INSERT INTO devices (id, token_hash) VALUES (?, ?)").bind(id, await sha256(token)).run();
    return json(request, env, { deviceId: id, token }, 201);
  }

  const deviceId = await authenticate(request, env);
  if (!deviceId) return json(request, env, { error: "unauthorized" }, 401);

  if (url.pathname === "/api/reminders" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT id, title, scheduled_at AS scheduledAt, status FROM reminders WHERE device_id = ? ORDER BY scheduled_at")
      .bind(deviceId).all();
    return json(request, env, { reminders: result.results });
  }

  if (url.pathname === "/api/reminders" && request.method === "POST") {
    const body = await request.json<{ title?: string; scheduledAt?: string }>();
    if (!body.title?.trim() || !body.scheduledAt || Number.isNaN(Date.parse(body.scheduledAt))) {
      return json(request, env, { error: "invalid_reminder" }, 400);
    }
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO reminders (id, device_id, title, scheduled_at) VALUES (?, ?, ?, ?)")
      .bind(id, deviceId, body.title.trim().slice(0, 240), new Date(body.scheduledAt).toISOString()).run();
    return json(request, env, { id, status: "pending" }, 201);
  }

  if (url.pathname === "/api/push/subscriptions" && request.method === "POST") {
    const body = await request.json<{ endpoint?: string; keys?: { p256dh?: string; auth?: string } }>();
    if (!body.endpoint || !body.keys?.p256dh || !body.keys.auth) return json(request, env, { error: "invalid_subscription" }, 400);
    await env.DB.prepare(
      "INSERT INTO push_subscriptions (device_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET device_id = excluded.device_id, p256dh = excluded.p256dh, auth = excluded.auth"
    ).bind(deviceId, body.endpoint, body.keys.p256dh, body.keys.auth).run();
    return json(request, env, { ok: true }, 201);
  }

  if (url.pathname === "/api/claude/messages" && request.method === "POST") {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) return json(request, env, { error: "missing_api_key" }, 400);
    if ((Number(request.headers.get("content-length")) || 0) > 8_000_000) return json(request, env, { error: "request_too_large" }, 413);
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        ...(request.headers.get("anthropic-beta") ? { "anthropic-beta": request.headers.get("anthropic-beta")! } : {}),
      },
      body: request.body,
    });
    return new Response(upstream.body, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json", ...corsHeaders(request, env) } });
  }

  return json(request, env, { error: "not_found" }, 404);
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env);
      } catch (error) {
        console.error(JSON.stringify({ event: "api_error", path: url.pathname, error: error instanceof Error ? error.message : String(error) }));
        return json(request, env, { error: "internal_error" }, 500);
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
  async scheduled(_controller: { scheduledTime: number }, env: Env, ctx: ExecutionContext): Promise<void> {
    const due = await env.DB.prepare(
      `SELECT reminders.id, push_subscriptions.endpoint
       FROM reminders
       JOIN push_subscriptions ON push_subscriptions.device_id = reminders.device_id
       WHERE reminders.status = 'pending' AND reminders.scheduled_at <= ?
       ORDER BY reminders.scheduled_at
       LIMIT 100`
    ).bind(new Date().toISOString()).all<{ id: string; endpoint: string }>();
    for (const reminder of due.results) {
      ctx.waitUntil((async () => {
        try {
          const response = await sendEmptyPush(reminder.endpoint, env);
          if (response.ok) {
            await env.DB.prepare("UPDATE reminders SET status = 'sent' WHERE id = ?").bind(reminder.id).run();
          } else if (response.status === 404 || response.status === 410) {
            await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(reminder.endpoint).run();
          }
          console.log(JSON.stringify({ event: "push_dispatch", reminderId: reminder.id, status: response.status }));
        } catch (error) {
          console.error(JSON.stringify({ event: "push_error", reminderId: reminder.id, error: error instanceof Error ? error.message : String(error) }));
        }
      })());
    }
  },
};

export default worker;
