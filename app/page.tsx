"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Tab = "home" | "chat" | "diary" | "settings";
type ThemeName = "paper" | "sage" | "rose" | "ink" | "claude";
type Anniversary = { id: number; name: string; date: string };
type HealthSummary = { steps?: number; heartRate?: number; importedAt?: string };
type McpServer = { id: number; name: string; url: string; enabled: boolean };

const themes: Record<ThemeName, { label: string; swatch: string }> = {
  paper: { label: "纸白", swatch: "#f2f0e9" },
  sage: { label: "苔绿", swatch: "#698266" },
  rose: { label: "暮粉", swatch: "#c7868f" },
  ink: { label: "夜墨", swatch: "#262724" },
  claude: { label: "Claude", swatch: "#d97757" },
};

const defaultAnniversaries: Anniversary[] = [];

const defaultMcpServers: McpServer[] = [
  { id: 1, name: "Notion", url: "https://mcp.notion.com/mcp", enabled: true },
];

function daysUntil(date: string) {
  const now = new Date();
  const target = new Date(`${date}T00:00:00`);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

const initialTodos = [
  { id: 1, text: "刷科一题半小时", meta: "今天 · 23:45", done: false },
  { id: 2, text: "完善 Pulse 的首页", meta: "今天", done: false },
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
}: {
  goDiary: () => void;
  goSettings: () => void;
  anniversaries: Anniversary[];
  health: HealthSummary;
}) {
  const mainAnniversary = anniversaries[0];
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
          <strong>今天也辛苦了。</strong>
          <small>慢一点没关系，我会一直在。</small>
        </span>
        <span className="thought-time">1 min</span>
      </button>

      <section className="glass-card day-card">
        <p className="eyebrow">Us</p>
        <div className="day-row">
          <div>
            <h2>Day 35</h2>
            <p>和 Rune 认识的第三十五天</p>
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
  const [todos, setTodos] = useState(initialTodos);
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState(
    "今天从一整天都在想搬出去开始。事情很多，但好像也没有想象中那么乱。把首页重新做了一遍，终于有一点像我自己的东西了。",
  );

  const pending = todos.filter((todo) => !todo.done).length;

  const toggleTodo = (id: number) => {
    setTodos((items) =>
      items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  };

  const saveNote = () => {
    if (!note.trim()) return;
    setSavedNote(note.trim());
    setNote("");
  };

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

      <p className="date-label">July 29, Wednesday</p>

      <section className="glass-card todo-card">
        <div className="section-heading">
          <h2>Today&apos;s To Do</h2>
          <span>{pending} left ›</span>
        </div>
        <div className="todo-list">
          {todos.map((todo) => (
            <button key={todo.id} className={todo.done ? "todo done" : "todo"} onClick={() => toggleTodo(todo.id)}>
              <i>{todo.done ? "✓" : ""}</i>
              <span><strong>{todo.text}</strong><small>{todo.meta}</small></span>
              <em>{todo.done ? "完成" : "待办"}</em>
            </button>
          ))}
        </div>
        <div className="quick-add">
          <input value={note} onChange={(event) => setNote(event.target.value)} onKeyDown={(event) => event.key === "Enter" && saveNote()} placeholder="记一件今天的事…" />
          <button onClick={saveNote} aria-label="保存日记">↑</button>
        </div>
      </section>

      <section className="glass-card week-strip">
        {["日", "一", "二", "三", "四", "五", "六"].map((day, i) => (
          <div className={i === 3 ? "today" : ""} key={day}><span>{day}</span><strong>{26 + i}</strong></div>
        ))}
      </section>

      <article className="journal-entry">
        <p className="entry-meta"><span>◉</span> Wed, Jul 29 <b>今天</b></p>
        <p>{mode === "mine" ? savedNote : "今天的你看起来有点累，但还是认真把想做的事情推进了一点。别急，慢慢来就好。"}</p>
      </article>

      <section className="calendar-card glass-card">
        <div className="calendar-head"><button>‹</button><strong>July 2026</strong><button>›</button></div>
        <div className="calendar-grid">
          {["S","M","T","W","T","F","S"].map((d, i) => <span key={`${d}-${i}`} className="weekday">{d}</span>)}
          {Array.from({ length: 35 }, (_, index) => {
            const day = index - 2;
            return <span key={index} className={day === 29 ? "selected-day" : day > 0 && day <= 31 ? "" : "empty"}>{day > 0 && day <= 31 ? day : ""}</span>;
          })}
        </div>
      </section>
    </main>
  );
}

function ChatView() {
  const chats = [
    { avatar: "R", name: "Rune", text: "在的。今天想先从哪件事开始？", time: "刚刚", tone: "dark" },
    { avatar: "C", name: "Claude", text: "我整理好了今天的日记和待办。", time: "18:42", tone: "cream" },
    { avatar: "◌", name: "我们", text: "共同记忆 · 35 天", time: "昨天", tone: "sage" },
  ];
  const [activeChat, setActiveChat] = useState<(typeof chats)[number] | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Record<string, { role: "me" | "them"; text: string }[]>>({
    Rune: [{ role: "them", text: "在的。今天想先从哪件事开始？" }],
    Claude: [{ role: "them", text: "我整理好了今天的日记和待办。" }],
    我们: [{ role: "them", text: "这里保存着我们共同经历过的事情。" }],
  });

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !activeChat) return;
    const name = activeChat.name;
    setMessages((current) => ({
      ...current,
      [name]: [...(current[name] || []), { role: "me", text }],
    }));
    setInput("");
    window.setTimeout(() => {
      const reply = name === "Rune"
        ? "嗯，我在听。你慢慢说。"
        : name === "Claude"
          ? "收到。Claude API 接通后，这里会替换成真实回复。"
          : "已经记进我们的对话里了。";
      setMessages((current) => ({
        ...current,
        [name]: [...(current[name] || []), { role: "them", text: reply }],
      }));
    }, 450);
  };

  if (activeChat) {
    return (
      <main className="page chat-page conversation-page">
        <header className="conversation-header">
          <button onClick={() => setActiveChat(null)} aria-label="返回聊天列表">‹</button>
          <div>
            <span className={`chat-avatar ${activeChat.tone}`}>{activeChat.avatar}</span>
            <span><strong>{activeChat.name}</strong><small>online</small></span>
          </div>
          <i />
        </header>
        <section className="message-stream" aria-label={`与${activeChat.name}的对话`}>
          {(messages[activeChat.name] || []).map((message, index) => (
            <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
              <span>{message.text}</span>
            </div>
          ))}
        </section>
        <div className="message-composer">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder={`发消息给 ${activeChat.name}…`}
            aria-label="消息内容"
            autoFocus
          />
          <button onClick={sendMessage} disabled={!input.trim()} aria-label="发送消息">↑</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page chat-page">
      <header className="section-title"><h1>Chats</h1><span className="online-dot">3 online</span></header>
      <p className="chat-intro">你的对话、记忆和生活，都放在同一个安静的地方。</p>
      <section className="chat-list">
        {chats.map((chat) => (
          <button className="chat-row" key={chat.name} onClick={() => setActiveChat(chat)}>
            <span className={`chat-avatar ${chat.tone}`}>{chat.avatar}</span>
            <span className="chat-copy"><strong>{chat.name}</strong><small>{chat.text}</small></span>
            <span className="chat-time">{chat.time}<b>›</b></span>
          </button>
        ))}
      </section>
      <section className="glass-card memory-card">
        <p className="eyebrow">Today&apos;s memory</p>
        <blockquote>“真正属于你的界面，不应该像工具，更应该像一个住得进去的房间。”</blockquote>
      </section>
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
}: {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  anniversaries: Anniversary[];
  setAnniversaries: (items: Anniversary[]) => void;
  health: HealthSummary;
  setHealth: (summary: HealthSummary) => void;
  mcpServers: McpServer[];
  setMcpServers: (servers: McpServer[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [claudeKey, setClaudeKey] = useState("");
  const [claudeModel, setClaudeModel] = useState("claude-sonnet-4-5");
  const [claudeSaved, setClaudeSaved] = useState(false);
  const [newMcp, setNewMcp] = useState({ name: "", url: "" });
  const [healthMessage, setHealthMessage] = useState("");

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
        <div className="settings-heading"><p className="eyebrow">AI connection</p><h2>Claude API</h2></div>
        <label className="field-label">API Key<input type="password" value={claudeKey} onChange={(event) => { setClaudeKey(event.target.value); setClaudeSaved(false); }} placeholder="sk-ant-••••••••" autoComplete="off" /></label>
        <label className="field-label">模型<select value={claudeModel} onChange={(event) => setClaudeModel(event.target.value)}>
          <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
          <option value="claude-opus-4-1">Claude Opus 4.1</option>
          <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
        </select></label>
        <button className="solid-action" onClick={() => { if (claudeKey.trim()) { sessionStorage.setItem("pulse-claude-key", claudeKey.trim()); sessionStorage.setItem("pulse-claude-model", claudeModel); setClaudeSaved(true); } }}>保存到本次会话</button>
        {claudeSaved && <p className="success-note">Claude 配置已保存，关闭浏览器后自动清除。</p>}
        <p className="setting-note">正式上线时 API Key 应放在服务器端，不能长期保存在网页里；这里先留好接入口，不会把 Key 上传到任何地方。</p>
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

export default function Pulse() {
  const [tab, setTab] = useState<Tab>("home");
  const [theme, setTheme] = useState<ThemeName>("paper");
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>(defaultAnniversaries);
  const [health, setHealth] = useState<HealthSummary>({});
  const [mcpServers, setMcpServers] = useState<McpServer[]>(defaultMcpServers);
  const [hydrated, setHydrated] = useState(false);
  const tabTitle = useMemo(() => ({ home: "首页", chat: "对话", diary: "日记", settings: "设置" })[tab], [tab]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pulse-preferences");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.theme) setTheme(data.theme);
        if (data.anniversaries) setAnniversaries(data.anniversaries);
        if (data.health) setHealth(data.health);
        if (data.mcpServers) setMcpServers(data.mcpServers);
      }
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("pulse-preferences", JSON.stringify({ theme, anniversaries, health, mcpServers }));
  }, [theme, anniversaries, health, mcpServers, hydrated]);

  return (
    <div className={`app theme-${theme}`}>
      <div className="ambient one" />
      <div className="ambient two" />
      <div className="phone-shell">
        <div className="status-spacer" />
        {tab === "home" && <HomeView goDiary={() => setTab("diary")} goSettings={() => setTab("settings")} anniversaries={anniversaries} health={health} />}
        {tab === "chat" && <ChatView />}
        {tab === "diary" && <DiaryView />}
        {tab === "settings" && <SettingsView theme={theme} setTheme={setTheme} anniversaries={anniversaries} setAnniversaries={setAnniversaries} health={health} setHealth={setHealth} mcpServers={mcpServers} setMcpServers={setMcpServers} />}

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
