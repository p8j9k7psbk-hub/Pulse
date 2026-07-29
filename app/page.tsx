"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Tab = "home" | "chat" | "diary" | "settings";
type ThemeName = "paper" | "sage" | "rose" | "ink" | "claude";
type Anniversary = { id: number; name: string; date: string };
type HealthSummary = { steps?: number; heartRate?: number; importedAt?: string };
type McpServer = { id: number; name: string; url: string; enabled: boolean; requiresAuth?: boolean };
type Todo = { id: number; text: string; meta: string; done: boolean };
type ClaudeModel = { id: string; display_name: string; created_at?: string };
type ChatAttachment = { id: number; name: string; kind: "image" | "text"; mediaType: string; data: string };
type ChatMessage = { role: "user" | "assistant"; text: string; attachments?: ChatAttachment[] };
type RuneAction = { id: string; name: "add_todo" | "write_diary" | "set_home_message" | "create_reminder"; input: Record<string, string>; status: "pending" | "done" | "cancelled" };

const themes: Record<ThemeName, { label: string; swatch: string }> = {
  paper: { label: "纸白", swatch: "#f2f0e9" },
  sage: { label: "苔绿", swatch: "#698266" },
  rose: { label: "暮粉", swatch: "#c7868f" },
  ink: { label: "夜墨", swatch: "#262724" },
  claude: { label: "Claude", swatch: "#d97757" },
};

const defaultAnniversaries: Anniversary[] = [];

const defaultMcpServers: McpServer[] = [
  { id: 1, name: "Notion", url: "https://mcp.notion.com/mcp", enabled: false, requiresAuth: true },
];

function daysUntil(date: string) {
  const now = new Date();
  const target = new Date(`${date}T00:00:00`);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysTogether(date: string) {
  if (!date) return null;
  const start = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
}

function runeApiBase() {
  if (typeof globalThis.location === "undefined") return "";
  return globalThis.location.hostname === "pulse-private-space.q6r6nrp7qy.chatgpt.site"
    ? ""
    : "https://pulse-private-space.q6r6nrp7qy.chatgpt.site";
}

function decodeBase64Url(value: string) {
  const padded = `${value.replaceAll("-", "+").replaceAll("_", "/")}${"=".repeat((4 - value.length % 4) % 4)}`;
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

const initialTodos: Todo[] = [
  { id: 1, text: "刷科一题半小时", meta: "今天 · 23:45", done: false },
  { id: 2, text: "完善 Rune 的首页", meta: "今天", done: false },
  { id: 3, text: "回抖音评论", meta: "下午", done: true },
];

function HeaderButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className="icon-button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function HomeView({
  goDiary,
  goSettings,
  anniversaries,
  health,
  metDate,
  homeMessage,
}: {
  goDiary: () => void;
  goSettings: () => void;
  anniversaries: Anniversary[];
  health: HealthSummary;
  metDate: string;
  homeMessage: string;
}) {
  const mainAnniversary = anniversaries[0];
  const knownDays = daysTogether(metDate);
  return (
    <main className="page home-page">
      <header className="home-header">
        <div>
          <p className="eyebrow">Wednesday, July 29</p>
          <h1>Good evening, 沈澈</h1>
        </div>
        <HeaderButton label="打开设置" onClick={goSettings}>
          <span className="sun-icon">☼</span>
        </HeaderButton>
      </header>

      <button className="thought-card dark-card" onClick={goDiary}>
        <span className="mini-avatar">R</span>
        <span>
          <strong>{homeMessage}</strong>
          <small>慢一点没关系，我会一直在。</small>
        </span>
        <span className="thought-time">1 min</span>
      </button>

      <section className="glass-card day-card">
        <p className="eyebrow">Us</p>
        <div className="day-row">
          <div>
            <h2>{knownDays ? `Day ${knownDays}` : "设置日期"}</h2>
            <p>{knownDays ? `和 Rune 认识的第 ${knownDays} 天` : "前往设置填写和 Rune 认识的日期"}</p>
          </div>
          <span className="soft-heart">♥</span>
        </div>
      </section>

      <button className="glass-card anniversary-card editable-card" onClick={goSettings}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Next Anniversary</p>
            <strong>{mainAnniversary?.name || "添加纪念日"}</strong>
          </div>
          <div className="countdown">
            <span>{mainAnniversary ? daysUntil(mainAnniversary.date) : "＋"}</span>
            <small>days</small>
          </div>
        </div>
        <div className="date-facts compact-facts">
          {anniversaries.slice(0, 2).map((item) => (
            <div key={item.id}><span>{item.name}</span><strong>{daysUntil(item.date)}</strong><small>days</small></div>
          ))}
        </div>
        <span className="edit-hint">点按编辑</span>
      </button>

      <section className="metrics-grid">
        <article className="glass-card metric-card">
          <p>Steps <small>{health.importedAt ? "已导入" : "未连接"}</small></p>
          <h3>{health.steps?.toLocaleString() ?? "—"}</h3>
          <div className="bars" aria-label="近七日步数">
            {[18, 34, 46, 28, 40, 25, health.steps ? 64 : 8].map((height, i) => (
              <i key={i} style={{ height }} />
            ))}
          </div>
        </article>
        <article className="glass-card metric-card" onClick={goSettings}>
          <p>Heart Rate <small>{health.importedAt ? "最新" : "未连接"}</small></p>
          <h3>{health.heartRate ?? "—"}{health.heartRate && <small> bpm</small>}</h3>
          <div className="heartbeat">⌁⌁╱╲⌁╱╲⌁</div>
          <small>{health.importedAt ? `导入于 ${health.importedAt}` : "前往设置导入 Health 数据"}</small>
        </article>
        <article className="glass-card metric-card">
          <p>Focus</p>
          <h3>3h<small> 12m</small></h3>
          <div className="focus-line"><i /></div>
          <small>今日完成 4 项</small>
        </article>
        <article className="glass-card metric-card cycle-card" onClick={goSettings}>
          <p>Health <small>Apple</small></p>
          <div className="cycle-value"><span>♥</span><strong>{health.importedAt ? "已导入" : "连接"}</strong></div>
          <small>{health.importedAt ? "数据保存在此设备" : "导入 Apple Health export"}</small>
        </article>
      </section>

      <button className="primary-action" onClick={goDiary}>
        查看今天 <span>→</span>
      </button>
    </main>
  );
}

function DiaryView() {
  const [mode, setMode] = useState<"mine" | "rune">("mine");
  const today = useMemo(() => new Date(), []);
  const todayKey = localDateKey(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [todosByDate, setTodosByDate] = useState<Record<string, Todo[]>>({ [todayKey]: initialTodos });
  const [newTodo, setNewTodo] = useState("");
  const [diaryByDate, setDiaryByDate] = useState<Record<string, string>>({
    [todayKey]: "今天从一整天都在想搬出去开始。事情很多，但好像也没有想象中那么乱。把首页重新做了一遍，终于有一点像我自己的东西了。",
  });
  const [editingDiary, setEditingDiary] = useState(false);
  const [diaryDraft, setDiaryDraft] = useState("");
  const selectedKey = localDateKey(selectedDate);
  const todos = todosByDate[selectedKey] || [];

  const pending = todos.filter((todo) => !todo.done).length;

  const toggleTodo = (id: number) => {
    setTodosByDate((all) => ({
      ...all,
      [selectedKey]: todos.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    }));
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodosByDate((all) => ({
      ...all,
      [selectedKey]: [...(all[selectedKey] || []), { id: Date.now(), text: newTodo.trim(), meta: selectedKey === todayKey ? "今天" : selectedDate.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }), done: false }],
    }));
    setNewTodo("");
  };

  useEffect(() => {
    if (typeof globalThis.document === "undefined") return;
    const stored = localStorage.getItem("pulse-diary-todos");
    if (stored) setTodosByDate(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (typeof globalThis.document === "undefined") return;
    localStorage.setItem("pulse-diary-todos", JSON.stringify(todosByDate));
  }, [todosByDate]);

  useEffect(() => {
    if (typeof globalThis.document === "undefined") return;
    const stored = localStorage.getItem("pulse-diary-entries");
    if (stored) setDiaryByDate(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (typeof globalThis.document === "undefined") return;
    localStorage.setItem("pulse-diary-entries", JSON.stringify(diaryByDate));
  }, [diaryByDate]);

  useEffect(() => {
    setDiaryDraft(diaryByDate[selectedKey] || "");
    setEditingDiary(false);
  }, [selectedKey, diaryByDate]);

  const saveDiary = () => {
    const value = diaryDraft.trim();
    setDiaryByDate((all) => {
      if (!value) {
        const next = { ...all };
        delete next[selectedKey];
        return next;
      }
      return { ...all, [selectedKey]: value };
    });
    setEditingDiary(false);
  };

  const firstWeekday = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarCells = Array.from({ length: 42 }, (_, index) => index - firstWeekday + 1);
  const formattedDate = selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", weekday: "long" });
  const isToday = selectedKey === todayKey;

  return (
    <main className="page diary-page">
      <header className="section-title">
        <h1>Diary</h1>
        <span className="book-mark">▣</span>
      </header>

      <div className="segmented-control">
        <button className={mode === "mine" ? "active" : ""} onClick={() => setMode("mine")}>kiki</button>
        <button className={mode === "rune" ? "active" : ""} onClick={() => setMode("rune")}>Rune</button>
      </div>

      <p className="date-label">{formattedDate}</p>

      <section className="glass-card todo-card">
        <div className="section-heading">
          <h2>{isToday ? "Today's To Do" : "To Do"}</h2>
          <span>{pending} left ›</span>
        </div>
        <div className="todo-list">
          {!todos.length && <p className="empty-todos">这一天还没有待办。</p>}
          {todos.map((todo) => (
            <button key={todo.id} className={todo.done ? "todo done" : "todo"} onClick={() => toggleTodo(todo.id)}>
              <i>{todo.done ? "✓" : ""}</i>
              <span><strong>{todo.text}</strong><small>{todo.meta}</small></span>
              <em>{todo.done ? "完成" : "待办"}</em>
            </button>
          ))}
        </div>
        <div className="quick-add">
          <input value={newTodo} onChange={(event) => setNewTodo(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addTodo()} placeholder={`添加 ${selectedDate.getMonth() + 1} 月 ${selectedDate.getDate()} 日的待办…`} />
          <button onClick={addTodo} aria-label="添加待办">＋</button>
        </div>
      </section>

      <section className="glass-card week-strip">
        {Array.from({ length: 7 }, (_, index) => {
          const date = new Date(selectedDate);
          date.setDate(selectedDate.getDate() - selectedDate.getDay() + index);
          const key = localDateKey(date);
          return <button className={key === selectedKey ? "today" : ""} key={key} onClick={() => setSelectedDate(date)}><span>{["日", "一", "二", "三", "四", "五", "六"][index]}</span><strong>{date.getDate()}</strong></button>;
        })}
      </section>

      <article className="journal-entry">
        <div className="entry-meta-row">
          <p className="entry-meta"><span>◉</span> {formattedDate} {isToday && <b>今天</b>}</p>
          {mode === "mine" && !editingDiary && <button onClick={() => setEditingDiary(true)}>{diaryByDate[selectedKey] ? "编辑" : "写日记"}</button>}
        </div>
        {mode === "mine" && editingDiary ? (
          <div className="diary-editor">
            <textarea autoFocus value={diaryDraft} onChange={(event) => setDiaryDraft(event.target.value)} placeholder="写下这一天发生的事、心情或想记住的话……" />
            <div>
              <button className="text-action" onClick={() => { setDiaryDraft(diaryByDate[selectedKey] || ""); setEditingDiary(false); }}>取消</button>
              <button className="save-diary" onClick={saveDiary}>保存日记</button>
            </div>
          </div>
        ) : (
          <p className={!diaryByDate[selectedKey] && mode === "mine" ? "empty-entry" : ""}>
            {mode === "mine"
              ? diaryByDate[selectedKey] || "这一天还没有写日记。"
              : "今天的你看起来有点累，但还是认真把想做的事情推进了一点。别急，慢慢来就好。"}
          </p>
        )}
      </article>

      <section className="calendar-card glass-card">
        <div className="calendar-head">
          <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>‹</button>
          <strong>{calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong>
          <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>›</button>
        </div>
        <div className="calendar-grid">
          {["S","M","T","W","T","F","S"].map((d, i) => <span key={`${d}-${i}`} className="weekday">{d}</span>)}
          {calendarCells.map((day, index) => {
            if (day < 1 || day > daysInMonth) return <span key={index} className="empty" />;
            const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
            const key = localDateKey(date);
            const hasTodos = Boolean(todosByDate[key]?.length);
            return <button key={key} className={`${key === selectedKey ? "selected-day" : ""} ${hasTodos ? "has-todos" : ""}`} onClick={() => setSelectedDate(date)}>{day}</button>;
          })}
        </div>
      </section>
    </main>
  );
}

function ChatView({
  claudeKey,
  claudeModel,
  claudeModels,
  setClaudeModel,
  goSettings,
  mcpServers,
  setHomeMessage,
}: {
  claudeKey: string;
  claudeModel: string;
  claudeModels: ClaudeModel[];
  setClaudeModel: (model: string) => void;
  goSettings: () => void;
  mcpServers: McpServer[];
  setHomeMessage: (message: string) => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [chatNotice, setChatNotice] = useState("");
  const [actions, setActions] = useState<RuneAction[]>([]);
  const attachmentRef = useRef<HTMLInputElement>(null);
  const selectedModel = claudeModels.find((model) => model.id === claudeModel);

  const addAttachments = async (files?: FileList | null) => {
    if (!files?.length) return;
    const accepted: ChatAttachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setChatNotice(`${file.name} 超过 5MB，暂时不能添加。`);
        continue;
      }
      if (file.type.startsWith("image/")) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        accepted.push({ id: Date.now() + accepted.length, name: file.name, kind: "image", mediaType: file.type, data: dataUrl.split(",")[1] || "" });
      } else {
        accepted.push({ id: Date.now() + accepted.length, name: file.name, kind: "text", mediaType: file.type || "text/plain", data: await file.text() });
      }
    }
    setAttachments((current) => [...current, ...accepted].slice(0, 5));
    if (accepted.length) setChatNotice(`已添加 ${accepted.length} 个附件。`);
    if (attachmentRef.current) attachmentRef.current.value = "";
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    setAttachments([]);
    setActions([]);
    setChatNotice("已开启新对话");
    globalThis.setTimeout(() => setChatNotice(""), 1800);
  };

  const applyRuneAction = async (action: RuneAction) => {
    const date = action.input.date || localDateKey(new Date());
    if (action.name === "add_todo") {
      const all = JSON.parse(localStorage.getItem("pulse-diary-todos") || "{}") as Record<string, Todo[]>;
      all[date] = [...(all[date] || []), { id: Date.now(), text: action.input.text || "新的待办", meta: date, done: false }];
      localStorage.setItem("pulse-diary-todos", JSON.stringify(all));
    }
    if (action.name === "write_diary") {
      const all = JSON.parse(localStorage.getItem("pulse-diary-entries") || "{}") as Record<string, string>;
      all[date] = action.input.content || "";
      localStorage.setItem("pulse-diary-entries", JSON.stringify(all));
    }
    if (action.name === "set_home_message") setHomeMessage(action.input.message || "今天也辛苦了。");
    if (action.name === "create_reminder") {
      const reminders = JSON.parse(localStorage.getItem("rune-reminders") || "[]") as Array<Record<string, string>>;
      reminders.push({ id: String(Date.now()), title: action.input.title || "Rune 提醒", datetime: action.input.datetime || "" });
      localStorage.setItem("rune-reminders", JSON.stringify(reminders));
      const deviceId = localStorage.getItem("rune-device-id");
      const deviceToken = localStorage.getItem("rune-device-token");
      if (deviceId && deviceToken) {
        const response = await fetch(`${runeApiBase()}/api/reminders`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-rune-device": deviceId, "x-rune-token": deviceToken },
          body: JSON.stringify({ title: action.input.title || "Rune 提醒", scheduledAt: action.input.datetime }),
        });
        if (!response.ok) throw new Error("提醒已保存在本机，但后台同步失败。");
      }
    }
    setActions((items) => items.map((item) => item.id === action.id ? { ...item, status: "done" } : item));
    setMessages((items) => [...items, { role: "assistant", text: `${action.name === "add_todo" ? "待办" : action.name === "write_diary" ? "日记" : action.name === "set_home_message" ? "首页文字" : "提醒"}已经更新。` }]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !attachments.length) || sending) return;
    const outgoingAttachments = attachments;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", text, attachments: outgoingAttachments }];
    setMessages(nextMessages);
    setInput("");
    setAttachments([]);
    if (!claudeKey || !claudeModel) {
      setMessages([...nextMessages, { role: "assistant", text: "先去 Settings 连接 Claude API 并选择模型，我就可以真正回复你了。" }]);
      return;
    }

    setSending(true);
    try {
      const enabledMcp = mcpServers.filter((server) => server.enabled && !server.requiresAuth && /^https:\/\//.test(server.url));
      const runeTools = [
        { name: "add_todo", description: "在 Rune Diary 的指定日期添加待办。任何写入都必须先向用户展示确认。", input_schema: { type: "object", properties: { date: { type: "string", description: "YYYY-MM-DD" }, text: { type: "string" } }, required: ["date", "text"] } },
        { name: "write_diary", description: "在 Rune Diary 的指定日期写入日记。任何写入都必须先向用户展示确认。", input_schema: { type: "object", properties: { date: { type: "string", description: "YYYY-MM-DD" }, content: { type: "string" } }, required: ["date", "content"] } },
        { name: "set_home_message", description: "修改 Rune 首页顶部的主要问候文字。", input_schema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] } },
        { name: "create_reminder", description: "创建一个 Rune 定时提醒。", input_schema: { type: "object", properties: { title: { type: "string" }, datetime: { type: "string", description: "带时区的 ISO 8601 时间" } }, required: ["title", "datetime"] } },
      ];
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": claudeKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          ...(enabledMcp.length ? { "anthropic-beta": "mcp-client-2025-11-20" } : {}),
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: 2048,
          system: `你是 Rune，一个安静、真诚、有温度的私人陪伴助手。使用简洁自然的中文回答。当前日期是 ${localDateKey(new Date())}，用户时区为 Asia/Singapore。需要修改 Rune 数据或创建提醒时必须调用对应工具，不要假装已经完成。`,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.role === "assistant" ? message.text : [
              ...(message.attachments || []).map((attachment) => attachment.kind === "image"
                ? { type: "image", source: { type: "base64", media_type: attachment.mediaType, data: attachment.data } }
                : { type: "text", text: `附件「${attachment.name}」内容：\n${attachment.data}` }),
              ...(message.text ? [{ type: "text", text: message.text }] : []),
            ],
          })),
          tools: [
            ...runeTools,
            ...enabledMcp.map((server) => ({ type: "mcp_toolset", mcp_server_name: server.name })),
          ],
          ...(enabledMcp.length ? { mcp_servers: enabledMcp.map((server) => ({ type: "url", url: server.url, name: server.name })) } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Claude API 请求失败");
      const reply = (data.content || []).filter((block: { type: string }) => block.type === "text").map((block: { text: string }) => block.text).join("\n");
      const proposed = (data.content || [])
        .filter((block: { type: string }) => block.type === "tool_use" && ["add_todo", "write_diary", "set_home_message", "create_reminder"].includes(block.name))
        .map((block: { id: string; name: RuneAction["name"]; input: Record<string, string> }) => ({ id: block.id, name: block.name, input: block.input, status: "pending" as const }));
      setMessages([...nextMessages, { role: "assistant", text: reply || (proposed.length ? "我准备执行下面的操作，请你确认。" : "我在。") }]);
      if (proposed.length) setActions((items) => [...items, ...proposed]);
    } catch (error) {
      setMessages([...nextMessages, { role: "assistant", text: `连接失败：${error instanceof Error ? error.message : "请检查 API Key 和网络。"}` }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="page claude-chat-page">
      <header className="claude-chat-header">
        <span className="claude-mini-mark"><img src="./pulse-icon-claude.png" alt="" /></span>
        <div><strong>Rune</strong><small>{selectedModel?.display_name || claudeModel || "尚未连接模型"}</small></div>
        <button onClick={startNewChat} aria-label="新对话">＋</button>
      </header>
      {chatNotice && <div className="chat-notice" role="status">{chatNotice}</div>}

      {claudeModels.length > 0 && (
        <select className="chat-model-select" value={claudeModel} onChange={(event) => setClaudeModel(event.target.value)} aria-label="当前 Claude 模型">
          {claudeModels.map((model) => <option key={model.id} value={model.id}>{model.display_name || model.id}</option>)}
        </select>
      )}

      <section className={messages.length ? "claude-message-stream" : "claude-message-stream empty"} aria-label="与 Rune 的对话">
        {!messages.length && (
          <div className="claude-welcome">
            <img src="./pulse-icon-claude.png" alt="" />
            <h1>今天想聊些什么？</h1>
            <p>{claudeKey ? "Rune 已经准备好了。" : "连接 Claude API 后，这里会变成真正的对话。"}</p>
            {!claudeKey && <button onClick={goSettings}>前往 Settings</button>}
          </div>
        )}
        {messages.map((message, index) => (
          <article className={`claude-message ${message.role}`} key={`${message.role}-${index}`}>
            {message.role === "assistant" && <span className="assistant-mark">✦</span>}
            <div>
              {!!message.attachments?.length && <div className="sent-attachments">{message.attachments.map((attachment) => <span key={attachment.id}>{attachment.kind === "image" ? "▧" : "≡"} {attachment.name}</span>)}</div>}
              {message.text && <p>{message.text}</p>}
            </div>
          </article>
        ))}
        {sending && <article className="claude-message assistant thinking"><span className="assistant-mark">✦</span><div><p>正在思考<span>•••</span></p></div></article>}
        {actions.map((action) => (
          <article className={`action-confirm-card ${action.status}`} key={action.id}>
            <p className="eyebrow">Rune action</p>
            <strong>{action.name === "add_todo" ? "添加待办" : action.name === "write_diary" ? "写入日记" : action.name === "set_home_message" ? "修改首页文字" : "创建提醒"}</strong>
            <p>{action.input.text || action.input.content || action.input.message || action.input.title}</p>
            <small>{action.input.date || action.input.datetime}</small>
            {action.status === "pending" ? <div><button onClick={() => setActions((items) => items.map((item) => item.id === action.id ? { ...item, status: "cancelled" } : item))}>取消</button><button onClick={async () => { try { await applyRuneAction(action); } catch (error) { setChatNotice(error instanceof Error ? error.message : "操作失败。"); } }}>确认</button></div> : <em>{action.status === "done" ? "✓ 已完成" : "已取消"}</em>}
          </article>
        ))}
      </section>

      <div className="claude-composer">
        {!!attachments.length && <div className="attachment-tray">{attachments.map((attachment) => <span key={attachment.id}>{attachment.kind === "image" ? "▧" : "≡"} {attachment.name}<button onClick={() => setAttachments(attachments.filter((item) => item.id !== attachment.id))} aria-label={`移除 ${attachment.name}`}>×</button></span>)}</div>}
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder="和 Rune 说点什么…"
          aria-label="消息内容"
          rows={2}
        />
        <input ref={attachmentRef} className="hidden-file" type="file" multiple accept="image/*,.txt,.md,.json,.csv,text/*" onChange={(event) => addAttachments(event.target.files)} />
        <div><button className="attach-button" onClick={() => attachmentRef.current?.click()} aria-label="添加附件">＋</button><small>{selectedModel?.display_name || "Claude"}</small><button className="send-button" onClick={sendMessage} disabled={(!input.trim() && !attachments.length) || sending} aria-label="发送消息">↑</button></div>
      </div>
    </main>
  );
}

function SettingsView({
  theme,
  setTheme,
  anniversaries,
  setAnniversaries,
  health,
  setHealth,
  mcpServers,
  setMcpServers,
  metDate,
  setMetDate,
  claudeKey,
  setClaudeKey,
  claudeModel,
  setClaudeModel,
  claudeModels,
  setClaudeModels,
}: {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  anniversaries: Anniversary[];
  setAnniversaries: (items: Anniversary[]) => void;
  health: HealthSummary;
  setHealth: (summary: HealthSummary) => void;
  mcpServers: McpServer[];
  setMcpServers: (servers: McpServer[]) => void;
  metDate: string;
  setMetDate: (date: string) => void;
  claudeKey: string;
  setClaudeKey: (key: string) => void;
  claudeModel: string;
  setClaudeModel: (model: string) => void;
  claudeModels: ClaudeModel[];
  setClaudeModels: (models: ClaudeModel[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [claudeStatus, setClaudeStatus] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);
  const [newMcp, setNewMcp] = useState({ name: "", url: "" });
  const [healthMessage, setHealthMessage] = useState("");
  const [notificationStatus, setNotificationStatus] = useState("");
  const [enablingNotifications, setEnablingNotifications] = useState(false);

  const updateAnniversary = (id: number, field: "name" | "date", value: string) => {
    setAnniversaries(anniversaries.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const addAnniversary = () => {
    setAnniversaries([...anniversaries, { id: Date.now(), name: "新的纪念日", date: new Date().toISOString().slice(0, 10) }]);
  };

  const importHealth = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setHealthMessage("请先解压 Apple 导出的 ZIP，再选择里面的 export.xml。");
      return;
    }
    const text = await file.text();
    const records = [...text.matchAll(/<Record\b[^>]*\/>/g)].map((match) => match[0]);
    const readAttribute = (record: string, name: string) => record.match(new RegExp(`${name}="([^"]+)"`))?.[1];
    const stepRecords = records
      .filter((record) => record.includes('type="HKQuantityTypeIdentifierStepCount"'))
      .map((record) => ({ value: Number(readAttribute(record, "value")), date: readAttribute(record, "startDate") || "" }));
    const heartRecords = records
      .filter((record) => record.includes('type="HKQuantityTypeIdentifierHeartRate"'))
      .map((record) => Number(readAttribute(record, "value")))
      .filter(Number.isFinite);
    const latestDay = stepRecords.at(-1)?.date.slice(0, 10);
    const steps = stepRecords
      .filter((record) => !latestDay || record.date.startsWith(latestDay))
      .reduce((sum, record) => sum + record.value, 0);
    const heartRate = heartRecords.length ? Math.round(heartRecords.at(-1) || 0) : undefined;
    const summary = {
      steps: steps || undefined,
      heartRate,
      importedAt: new Date().toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
    };
    setHealth(summary);
    setHealthMessage(`已读取 ${latestDay || "最近一天"}的数据。`);
  };

  const addMcp = () => {
    if (!newMcp.name.trim() || !newMcp.url.trim()) return;
    setMcpServers([...mcpServers, { id: Date.now(), name: newMcp.name.trim(), url: newMcp.url.trim(), enabled: true }]);
    setNewMcp({ name: "", url: "" });
  };

  const loadClaudeModels = async () => {
    if (!claudeKey.trim()) {
      setClaudeStatus("请先填写 API Key。");
      return;
    }
    setLoadingModels(true);
    setClaudeStatus("");
    try {
      const response = await fetch("https://api.anthropic.com/v1/models?limit=1000", {
        headers: {
          "x-api-key": claudeKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "读取模型失败");
      const models = (result.data || []) as ClaudeModel[];
      setClaudeModels(models);
      const preferred = models.find((model) => model.id === claudeModel)
        || models.find((model) => model.id.includes("sonnet-4-6"))
        || models.find((model) => model.id.includes("opus-4-6"))
        || models[0];
      if (preferred) setClaudeModel(preferred.id);
      sessionStorage.setItem("rune-claude-key", claudeKey.trim());
      sessionStorage.setItem("rune-claude-models", JSON.stringify(models));
      if (preferred) sessionStorage.setItem("rune-claude-model", preferred.id);
      setClaudeStatus(`连接成功，读取到 ${models.length} 个可用模型。`);
    } catch (error) {
      setClaudeStatus(`连接失败：${error instanceof Error ? error.message : "请检查 API Key。"}`);
    } finally {
      setLoadingModels(false);
    }
  };

  const enableNotifications = async () => {
    setEnablingNotifications(true);
    setNotificationStatus("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in globalThis)) throw new Error("当前浏览器不支持 Web Push。请先把 Rune 添加到 iPhone 主屏幕。");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("通知权限没有开启。可以稍后在 iPhone 设置里修改。");

      let deviceId = localStorage.getItem("rune-device-id") || "";
      let deviceToken = localStorage.getItem("rune-device-token") || "";
      if (!deviceId || !deviceToken) {
        const deviceResponse = await fetch(`${runeApiBase()}/api/devices`, { method: "POST" });
        const device = await deviceResponse.json();
        if (!deviceResponse.ok) throw new Error(device.error || "无法注册这台设备。");
        deviceId = device.deviceId;
        deviceToken = device.token;
        localStorage.setItem("rune-device-id", deviceId);
        localStorage.setItem("rune-device-token", deviceToken);
      }

      const registration = await navigator.serviceWorker.register("./sw.js");
      const keyResponse = await fetch(`${runeApiBase()}/api/push/key`);
      const keyData = await keyResponse.json();
      if (!keyResponse.ok || !keyData.publicKey) throw new Error("推送密钥尚未配置。");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeBase64Url(keyData.publicKey),
      });
      const subscriptionResponse = await fetch(`${runeApiBase()}/api/push/subscriptions`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-rune-device": deviceId, "x-rune-token": deviceToken },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!subscriptionResponse.ok) throw new Error("无法保存通知订阅。");
      setNotificationStatus("通知已经开启。之后由 Rune 创建的提醒可以显示在锁屏。");
    } catch (error) {
      setNotificationStatus(error instanceof Error ? error.message : "开启通知失败。");
    } finally {
      setEnablingNotifications(false);
    }
  };

  return (
    <main className="page settings-page">
      <header className="section-title"><h1>Settings</h1><span className="settings-mark">⌘</span></header>

      <section className="settings-section">
        <div className="settings-heading"><p className="eyebrow">Appearance</p><h2>主题颜色</h2></div>
        <div className="theme-options">
          {(Object.keys(themes) as ThemeName[]).map((key) => (
            <button key={key} className={theme === key ? "theme-option active" : "theme-option"} onClick={() => setTheme(key)}>
              <i style={{ background: themes[key].swatch }} />
              <span>{themes[key].label}</span>
              <b>{theme === key ? "✓" : ""}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-heading"><p className="eyebrow">Us</p><h2>和 Rune 认识的日期</h2></div>
        <label className="field-label">开始日期<input type="date" value={metDate} onChange={(event) => setMetDate(event.target.value)} /></label>
        <p className="setting-note">{metDate ? `首页会每天自动更新，目前是第 ${daysTogether(metDate)} 天。` : "设置后，首页的 Day 数字会每天自动更新。"}</p>
      </section>

      <section className="settings-section">
        <div className="settings-heading"><p className="eyebrow">Important dates</p><h2>纪念日</h2></div>
        <div className="editable-list">
          {anniversaries.map((item) => (
            <div className="editable-row" key={item.id}>
              <input aria-label="纪念日名称" value={item.name} onChange={(event) => updateAnniversary(item.id, "name", event.target.value)} />
              <input aria-label={`${item.name}日期`} type="date" value={item.date} onChange={(event) => updateAnniversary(item.id, "date", event.target.value)} />
              <button aria-label={`删除${item.name}`} onClick={() => setAnniversaries(anniversaries.filter((date) => date.id !== item.id))}>×</button>
            </div>
          ))}
        </div>
        <button className="outline-action" onClick={addAnniversary}>＋ 添加纪念日</button>
        <p className="setting-note">会自动保存在这台设备，首页倒数天数实时计算。</p>
      </section>

      <section className="settings-section">
        <div className="settings-heading"><p className="eyebrow">Health data</p><h2>Apple Health</h2></div>
        <div className="connection-card">
          <span className="connection-icon health-icon">♥</span>
          <span><strong>{health.importedAt ? "已导入 Health 数据" : "尚未连接"}</strong><small>{health.importedAt ? `上次导入：${health.importedAt}` : "网页版不能直接弹出 HealthKit 授权"}</small></span>
        </div>
        <input ref={fileRef} className="hidden-file" type="file" accept=".xml,text/xml" onChange={(event) => importHealth(event.target.files?.[0])} />
        <button className="solid-action" onClick={() => fileRef.current?.click()}>导入 export.xml</button>
        <a className="outline-action link-action" href="https://support.apple.com/guide/iphone/share-your-health-data-iph5ede58c3d/ios" target="_blank" rel="noreferrer">查看 Apple 导出教程 ↗</a>
        {healthMessage && <p className="success-note">{healthMessage}</p>}
        <p className="setting-note">直接 HealthKit 授权需要后续做一个 iPhone 原生伴侣 App；这一版先支持 Apple 官方导出的 XML，数据只在本机解析和保存。</p>
      </section>

      <section className="settings-section">
        <div className="settings-heading"><p className="eyebrow">Reminders</p><h2>系统通知</h2></div>
        <div className="connection-card">
          <span className="connection-icon notification-icon">◉</span>
          <span><strong>Rune 定时提醒</strong><small>在锁屏、通知中心和 Apple Watch 显示</small></span>
        </div>
        <button className="solid-action" onClick={enableNotifications} disabled={enablingNotifications}>{enablingNotifications ? "正在连接…" : "开启通知"}</button>
        {notificationStatus && <p className={notificationStatus.startsWith("通知已经") ? "success-note" : "error-note"}>{notificationStatus}</p>}
        <p className="setting-note">iPhone 需要先通过 Safari 把 Rune 添加到主屏幕，再从主屏幕打开 Rune 并点击此按钮授权。</p>
      </section>

      <section className="settings-section">
        <div className="settings-heading"><p className="eyebrow">AI connection</p><h2>Claude API</h2></div>
        <label className="field-label">API Key<input type="password" value={claudeKey} onChange={(event) => { setClaudeKey(event.target.value); setClaudeStatus(""); }} placeholder="sk-ant-••••••••" autoComplete="off" /></label>
        <button className="solid-action" onClick={loadClaudeModels} disabled={loadingModels}>
          {loadingModels ? "正在读取…" : "读取这个 Key 的可用模型"}
        </button>
        <label className="field-label">当前模型
          <select value={claudeModel} onChange={(event) => setClaudeModel(event.target.value)} disabled={!claudeModels.length}>
            {!claudeModels.length && <option value="">连接后选择模型</option>}
            {claudeModels.map((model) => <option key={model.id} value={model.id}>{model.display_name || model.id}</option>)}
          </select>
        </label>
        {claudeStatus && <p className={claudeStatus.startsWith("连接成功") ? "success-note" : "error-note"}>{claudeStatus}</p>}
        <p className="setting-note">Key 只保存在当前浏览器会话，关闭 Safari 后会清除。Rune 是静态网页，因此请求会从你的设备直接发给 Anthropic；若将来公开给别人使用，建议改成服务器代理，避免在浏览器里处理 Key。</p>
      </section>

      <section className="settings-section">
        <div className="settings-heading"><p className="eyebrow">Tools</p><h2>MCP 连接</h2></div>
        <div className="mcp-list">
          {mcpServers.map((server) => (
            <div className="mcp-row" key={server.id}>
              <button className={server.enabled ? "mini-switch on" : "mini-switch"} onClick={() => setMcpServers(mcpServers.map((item) => item.id === server.id ? { ...item, enabled: !item.enabled } : item))}><i /></button>
              <span><strong>{server.name}</strong><small>{server.url}</small></span>
              <button className="remove-row" onClick={() => setMcpServers(mcpServers.filter((item) => item.id !== server.id))}>×</button>
            </div>
          ))}
        </div>
        <div className="mcp-add">
          <input value={newMcp.name} onChange={(event) => setNewMcp({ ...newMcp, name: event.target.value })} placeholder="名称，如 Notion" />
          <input value={newMcp.url} onChange={(event) => setNewMcp({ ...newMcp, url: event.target.value })} placeholder="https://…/mcp" />
          <button className="outline-action" onClick={addMcp}>＋ 添加 MCP</button>
        </div>
      </section>
    </main>
  );
}

function SplashScreen({ leaving }: { leaving: boolean }) {
  return (
    <div className={leaving ? "splash-screen leaving" : "splash-screen"} aria-hidden="true">
      <div className="splash-mark">
        <img src="./pulse-icon-claude.png" alt="" />
      </div>
      <div className="splash-word">
        <strong>Rune</strong>
        <span>your quiet space</span>
      </div>
    </div>
  );
}

export default function Pulse() {
  const [tab, setTab] = useState<Tab>("home");
  const [theme, setTheme] = useState<ThemeName>("paper");
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>(defaultAnniversaries);
  const [health, setHealth] = useState<HealthSummary>({});
  const [mcpServers, setMcpServers] = useState<McpServer[]>(defaultMcpServers);
  const [metDate, setMetDate] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [claudeModel, setClaudeModel] = useState("");
  const [claudeModels, setClaudeModels] = useState<ClaudeModel[]>([]);
  const [homeMessage, setHomeMessage] = useState("今天也辛苦了。");
  const [hydrated, setHydrated] = useState(false);
  const [splashState, setSplashState] = useState<"visible" | "leaving" | "hidden">("visible");
  const tabTitle = useMemo(() => ({ home: "首页", chat: "对话", diary: "日记", settings: "设置" })[tab], [tab]);

  useEffect(() => {
    if (typeof globalThis.document === "undefined") return;
    const leaveTimer = globalThis.setTimeout(() => setSplashState("leaving"), 1550);
    const hideTimer = globalThis.setTimeout(() => setSplashState("hidden"), 2050);
    return () => {
      globalThis.clearTimeout(leaveTimer);
      globalThis.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (typeof globalThis.document === "undefined") return;
    try {
      const stored = localStorage.getItem("pulse-preferences");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.theme) setTheme(data.theme);
        if (data.anniversaries) setAnniversaries(data.anniversaries);
        if (data.health) setHealth(data.health);
        if (data.mcpServers) setMcpServers(data.mcpServers);
        if (data.metDate) setMetDate(data.metDate);
        if (data.homeMessage) setHomeMessage(data.homeMessage);
      }
      setClaudeKey(sessionStorage.getItem("rune-claude-key") || "");
      setClaudeModel(sessionStorage.getItem("rune-claude-model") || "");
      const storedModels = sessionStorage.getItem("rune-claude-models");
      if (storedModels) setClaudeModels(JSON.parse(storedModels));
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof globalThis.document === "undefined") return;
    if (!hydrated) return;
    localStorage.setItem("pulse-preferences", JSON.stringify({ theme, anniversaries, health, mcpServers, metDate, homeMessage }));
  }, [theme, anniversaries, health, mcpServers, metDate, homeMessage, hydrated]);

  useEffect(() => {
    if (typeof globalThis.document === "undefined" || !claudeModel) return;
    sessionStorage.setItem("rune-claude-model", claudeModel);
  }, [claudeModel]);

  return (
    <div className={`app theme-${theme}`}>
      {splashState !== "hidden" && <SplashScreen leaving={splashState === "leaving"} />}
      <div className="ambient one" />
      <div className="ambient two" />
      <div className="phone-shell">
        <div className="status-spacer" />
        {tab === "home" && <HomeView goDiary={() => setTab("diary")} goSettings={() => setTab("settings")} anniversaries={anniversaries} health={health} metDate={metDate} homeMessage={homeMessage} />}
        {tab === "chat" && <ChatView claudeKey={claudeKey} claudeModel={claudeModel} claudeModels={claudeModels} setClaudeModel={setClaudeModel} goSettings={() => setTab("settings")} mcpServers={mcpServers} setHomeMessage={setHomeMessage} />}
        {tab === "diary" && <DiaryView />}
        {tab === "settings" && <SettingsView theme={theme} setTheme={setTheme} anniversaries={anniversaries} setAnniversaries={setAnniversaries} health={health} setHealth={setHealth} mcpServers={mcpServers} setMcpServers={setMcpServers} metDate={metDate} setMetDate={setMetDate} claudeKey={claudeKey} setClaudeKey={setClaudeKey} claudeModel={claudeModel} setClaudeModel={setClaudeModel} claudeModels={claudeModels} setClaudeModels={setClaudeModels} />}

        <nav className="bottom-nav" aria-label="主导航">
          <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")} aria-label="首页"><i>⌂</i><span>Home</span></button>
          <button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")} aria-label="对话"><i>◌</i><span>Chats</span></button>
          <button className={tab === "diary" ? "active" : ""} onClick={() => setTab("diary")} aria-label="日记"><i>□</i><span>Diary</span></button>
          <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")} aria-label="设置"><i>⌘</i><span>Settings</span></button>
        </nav>
        <span className="sr-only" aria-live="polite">当前页面：{tabTitle}</span>
      </div>
    </div>
  );
}
