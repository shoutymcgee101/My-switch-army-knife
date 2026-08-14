import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckSquare, Square, Plus, Trash2, StickyNote, Wallet, ListChecks, X } from "lucide-react";

const PAPER = "#F6F3EA";
const PAPER_LINE = "#DCD5C1";
const INK = "#2A2620";
const INK_FAINT = "#8A8270";
const GREEN = "#2E5A48";
const GREEN_DIM = "#5C7F70";
const RUST = "#A8462F";

const STORAGE_KEY = "ledger-data-v1";

const uid = () => Math.random().toString(36).slice(2, 10);

const todayStamp = () => {
  const d = new Date();
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();
};

function useLedgerData() {
  const [data, setData] = useState({ tasks: [], notes: [], budget: [] });
  const [status, setStatus] = useState("loading"); // loading | ready | saving | error
  const saveTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (cancelled) return;
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setData({
            tasks: parsed.tasks || [],
            notes: parsed.notes || [],
            budget: parsed.budget || [],
          });
        }
        setStatus("ready");
      } catch (e) {
        if (!cancelled) setStatus("ready"); // no existing key yet is fine
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback((next) => {
    setData(next);
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const ok = await window.storage.set(STORAGE_KEY, JSON.stringify(next), false);
        setStatus(ok ? "ready" : "error");
      } catch (e) {
        setStatus("error");
      }
    }, 350);
  }, []);

  return { data, status, persist };
}

function Stamp() {
  return (
    <div
      style={{
        position: "absolute",
        top: 18,
        right: 22,
        border: `2px solid ${RUST}`,
        color: RUST,
        padding: "4px 10px",
        borderRadius: 3,
        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
        fontSize: 11,
        letterSpacing: "0.08em",
        transform: "rotate(4deg)",
        opacity: 0.75,
        userSelect: "none",
      }}
    >
      {todayStamp()}
    </div>
  );
}

function SyncDot({ status }) {
  const color = status === "ready" ? GREEN : status === "saving" ? "#C9A227" : status === "error" ? RUST : INK_FAINT;
  const label = status === "ready" ? "synced" : status === "saving" ? "saving…" : status === "error" ? "offline — retry" : "loading…";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "ui-monospace, monospace", fontSize: 11, color: INK_FAINT, letterSpacing: "0.04em" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label}
    </div>
  );
}

function EmptyRow({ children }) {
  return (
    <div style={{ padding: "28px 4px", color: INK_FAINT, fontFamily: "Georgia, 'Iowan Old Style', serif", fontStyle: "italic", fontSize: 14, borderBottom: `1px solid ${PAPER_LINE}` }}>
      {children}
    </div>
  );
}

function TasksTab({ tasks, setTasks }) {
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    if (!v) return;
    setTasks([{ id: uid(), text: v, done: false, ts: Date.now() }, ...tasks]);
    setText("");
  };
  const toggle = (id) => setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => setTasks(tasks.filter((t) => t.id !== id));

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task…"
          style={inputStyle}
        />
        <button onClick={add} style={addBtnStyle} aria-label="Add task">
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      {open.length === 0 && done.length === 0 && <EmptyRow>Nothing on the list. Add your first task above.</EmptyRow>}

      {open.map((t) => (
        <Row key={t.id} onDelete={() => remove(t.id)}>
          <button onClick={() => toggle(t.id)} style={checkBtnStyle} aria-label="Mark done">
            <Square size={17} color={INK_FAINT} strokeWidth={1.6} />
          </button>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: INK }}>{t.text}</span>
        </Row>
      ))}

      {done.length > 0 && (
        <div style={{ marginTop: 22, marginBottom: 8, fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.1em", color: INK_FAINT }}>
          DONE — {done.length}
        </div>
      )}
      {done.map((t) => (
        <Row key={t.id} onDelete={() => remove(t.id)}>
          <button onClick={() => toggle(t.id)} style={checkBtnStyle} aria-label="Mark not done">
            <CheckSquare size={17} color={GREEN} strokeWidth={1.8} />
          </button>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: INK_FAINT, textDecoration: "line-through" }}>{t.text}</span>
        </Row>
      ))}
    </div>
  );
}

function NotesTab({ notes, setNotes }) {
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    if (!v) return;
    setNotes([{ id: uid(), text: v, ts: Date.now() }, ...notes]);
    setText("");
  };
  const remove = (id) => setNotes(notes.filter((n) => n.id !== id));

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Jot something down…"
          rows={2}
          style={{ ...inputStyle, width: "100%", resize: "vertical", fontFamily: "Georgia, serif" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={add} style={{ ...addBtnStyle, width: "auto", padding: "8px 16px" }}>
            Add note
          </button>
        </div>
      </div>

      {notes.length === 0 && <EmptyRow>No notes yet. Whatever's on your mind goes here.</EmptyRow>}

      {notes.map((n) => (
        <Row key={n.id} onDelete={() => remove(n.id)} align="flex-start">
          <StickyNote size={16} color={GREEN_DIM} style={{ marginTop: 3, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: INK, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{n.text}</div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, color: INK_FAINT, marginTop: 4, letterSpacing: "0.03em" }}>
              {new Date(n.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        </Row>
      ))}
    </div>
  );
}

function BudgetTab({ budget, setBudget }) {
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [kind, setKind] = useState("out"); // out | in

  const add = () => {
    const v = desc.trim();
    const n = parseFloat(amt);
    if (!v || isNaN(n)) return;
    setBudget([{ id: uid(), desc: v, amount: kind === "out" ? -Math.abs(n) : Math.abs(n), ts: Date.now() }, ...budget]);
    setDesc("");
    setAmt("");
  };
  const remove = (id) => setBudget(budget.filter((b) => b.id !== id));
  const total = budget.reduce((s, b) => s + b.amount, 0);

  return (
    <div>
      <div
        style={{
          border: `2px solid ${INK}`,
          padding: "14px 16px",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          background: total >= 0 ? "rgba(46,90,72,0.06)" : "rgba(168,70,47,0.06)",
        }}
      >
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.1em", color: INK_FAINT }}>BALANCE</span>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 26, color: total >= 0 ? GREEN : RUST, fontWeight: "bold" }}>
          {total < 0 ? "−" : ""}${Math.abs(total).toFixed(2)}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description…" style={{ ...inputStyle, flex: 2 }} />
        <input
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="0.00"
          inputMode="decimal"
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <div style={{ display: "flex", border: `1px solid ${PAPER_LINE}`, flex: 1 }}>
          <button
            onClick={() => setKind("out")}
            style={{ ...toggleBtnStyle, background: kind === "out" ? RUST : "transparent", color: kind === "out" ? "#fff" : INK_FAINT }}
          >
            Spent
          </button>
          <button
            onClick={() => setKind("in")}
            style={{ ...toggleBtnStyle, background: kind === "in" ? GREEN : "transparent", color: kind === "in" ? "#fff" : INK_FAINT }}
          >
            Received
          </button>
        </div>
        <button onClick={add} style={{ ...addBtnStyle, width: 48 }} aria-label="Add entry">
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      {budget.length === 0 && <EmptyRow>No entries yet. Log what comes in and goes out.</EmptyRow>}

      {budget.map((b) => (
        <Row key={b.id} onDelete={() => remove(b.id)}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: INK, flex: 1 }}>{b.desc}</span>
          <span
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 14,
              color: b.amount < 0 ? RUST : GREEN,
              minWidth: 80,
              textAlign: "right",
            }}
          >
            {b.amount < 0 ? "−" : "+"}${Math.abs(b.amount).toFixed(2)}
          </span>
        </Row>
      ))}
    </div>
  );
}

function Row({ children, onDelete, align = "center" }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: align,
        gap: 10,
        padding: "13px 4px",
        borderBottom: `1px solid ${PAPER_LINE}`,
      }}
    >
      <div style={{ display: "flex", alignItems: align, gap: 10, flex: 1 }}>{children}</div>
      <button
        onClick={onDelete}
        aria-label="Delete"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          opacity: hover ? 1 : 0.25,
          transition: "opacity 0.15s",
          padding: 4,
          flexShrink: 0,
        }}
      >
        <Trash2 size={14} color={INK_FAINT} />
      </button>
    </div>
  );
}

const inputStyle = {
  border: `1px solid ${PAPER_LINE}`,
  background: "#FFFEFB",
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "ui-monospace, monospace",
  color: INK,
  outline: "none",
  flex: 1,
};

const addBtnStyle = {
  background: INK,
  color: PAPER,
  border: "none",
  width: 42,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "ui-monospace, monospace",
  fontSize: 13,
};

const checkBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  display: "flex",
  alignItems: "center",
};

const toggleBtnStyle = {
  flex: 1,
  border: "none",
  padding: "9px 0",
  cursor: "pointer",
  fontFamily: "ui-monospace, monospace",
  fontSize: 12,
  letterSpacing: "0.04em",
  transition: "background 0.15s",
};

const TABS = [
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "budget", label: "Budget", icon: Wallet },
];

export default function Ledger() {
  const { data, status, persist } = useLedgerData();
  const [tab, setTab] = useState("tasks");

  const setTasks = (tasks) => persist({ ...data, tasks });
  const setNotes = (notes) => persist({ ...data, notes });
  const setBudget = (budget) => persist({ ...data, budget });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAPER,
        backgroundImage:
          "repeating-linear-gradient(180deg, transparent, transparent 27px, rgba(42,38,32,0.035) 28px)",
        display: "flex",
        justifyContent: "center",
        padding: "24px 14px 60px",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480, position: "relative" }}>
        <Stamp />
        <div style={{ marginBottom: 6, paddingTop: 4 }}>
          <div style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 11, letterSpacing: "0.15em", color: GREEN_DIM, marginBottom: 4 }}>
            PERSONAL LEDGER
          </div>
          <h1 style={{ fontSize: 30, margin: 0, color: INK, fontWeight: "normal", letterSpacing: "-0.01em" }}>
            {TABS.find((t) => t.key === tab).label}
          </h1>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: `2px solid ${INK}`, paddingBottom: 10 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "none",
                  background: tab === key ? INK : "transparent",
                  color: tab === key ? PAPER : INK_FAINT,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 12,
                  letterSpacing: "0.03em",
                  borderRadius: 2,
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
          <SyncDot status={status} />
        </div>

        {status === "loading" ? (
          <div style={{ color: INK_FAINT, fontStyle: "italic", padding: "40px 4px" }}>Opening the ledger…</div>
        ) : (
          <>
            {tab === "tasks" && <TasksTab tasks={data.tasks} setTasks={setTasks} />}
            {tab === "notes" && <NotesTab notes={data.notes} setNotes={setNotes} />}
            {tab === "budget" && <BudgetTab budget={data.budget} setBudget={setBudget} />}
          </>
        )}

        <div style={{ marginTop: 32, textAlign: "center", fontFamily: "ui-monospace, monospace", fontSize: 10.5, color: INK_FAINT, letterSpacing: "0.03em" }}>
          Same ledger, every device you open it on.
        </div>
      </div>
    </div>
  );
}
