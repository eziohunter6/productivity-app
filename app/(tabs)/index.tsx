import {
  Activity,
  AlertCircle,
  Archive,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Compass,
  CornerUpLeft,
  Droplets, Dumbbell,
  FileText,
  Flame,
  Inbox,
  LayoutDashboard,
  Mail,
  Moon,
  Plus, Search,
  TrendingDown,
  TrendingUp,
  Wind,
  X,
  Zap
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const HABITS_INIT = [
  { id: 1, name: "No cigarettes", Icon: Wind,     streak: 3,  goal: 30, done: false, color: "#EF4444", points: 15 },
  { id: 2, name: "Gym",           Icon: Dumbbell, streak: 5,  goal: 30, done: true,  color: "#16A34A", points: 20 },
  { id: 3, name: "8hrs sleep",    Icon: Moon,     streak: 7,  goal: 30, done: true,  color: "#7C3AED", points: 18 },
  { id: 4, name: "2L water",      Icon: Droplets, streak: 12, goal: 30, done: false, color: "#2563EB", points: 10 },
];
const TASKS_INIT = [
  { id: 1, time: "09:00", title: "Team standup",           type: "calendar", done: false, urgent: false, points: 8  },
  { id: 2, time: "10:30", title: "Review Q1 deck",         type: "doc",      done: false, urgent: true,  points: 12 },
  { id: 3, time: "12:00", title: "Gym session",            type: "habit",    done: true,  urgent: false, points: 20 },
  { id: 4, time: "14:00", title: "Reply to Sarah's email", type: "email",    done: false, urgent: true,  points: 10 },
  { id: 5, time: "16:00", title: "1:1 with manager",       type: "calendar", done: false, urgent: false, points: 8  },
  { id: 6, time: "19:00", title: "Smoke-free check-in",    type: "habit",    done: false, urgent: false, points: 15 },
];
const EMAILS = [
  { id: 1, from: "Sarah Chen",   initials: "SC", subject: "Q2 Strategy Review",   preview: "Can we align on priorities before the board...", time: "9:41 AM", unread: true,  urgent: true  },
  { id: 2, from: "Marcus Webb",  initials: "MW", subject: "Investor update draft", preview: "I've attached the latest version with edits...", time: "8:20 AM", unread: true,  urgent: false },
  { id: 3, from: "Priya Sharma", initials: "PS", subject: "Gym buddy tomorrow?",  preview: "Hey! Are you going to the 7am class?",          time: "7:55 AM", unread: false, urgent: false },
];
const GOALS = [
  { id: 1, title: "Quit smoking",       desc: "3 days in · next: 7 days",  pct: 10, color: "#EF4444", Icon: Wind,     momentum: +5  },
  { id: 2, title: "Gym 4x/week",        desc: "Week 3 · avg 3.5x",         pct: 62, color: "#16A34A", Icon: Dumbbell, momentum: +12 },
  { id: 3, title: "Inbox zero daily",   desc: "12 day streak",             pct: 78, color: "#2563EB", Icon: Inbox,    momentum: +3  },
  { id: 4, title: "Sleep 8hrs nightly", desc: "7 day streak",              pct: 45, color: "#7C3AED", Icon: Moon,     momentum: -4  },
];
const TYPE_META = {
  calendar: { label: "Meeting", Icon: Calendar, color: "#2563EB" },
  doc:      { label: "Doc",     Icon: FileText,  color: "#16A34A" },
  habit:    { label: "Habit",   Icon: Activity,  color: "#EA580C" },
  email:    { label: "Email",   Icon: Mail,      color: "#DC2626" },
};

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#FFFFFF", surface: "#F7F7F7", border: "#E8E8E8",
  text1: "#111111", text2: "#555555", text3: "#999999",
  danger: "#DC2626",
};

// ─── MOMENTUM ─────────────────────────────────────────────────────────────────
function calcMomentum(tasks, habits) {
  const tp = tasks.filter(t => t.done).reduce((s, t) => s + t.points, 0);
  const hp = habits.filter(h => h.done).reduce((s, h) => s + h.points, 0);
  const mt = tasks.reduce((s, t) => s + t.points, 0);
  const mh = habits.reduce((s, h) => s + h.points, 0);
  return Math.round(Math.min(100, Math.max(0, ((tp + hp) / (mt + mh)) * 100 + 28)));
}
function momentumMeta(score) {
  if (score >= 80) return { word: "In Flow",   color: "#16A34A" };
  if (score >= 60) return { word: "Building",  color: "#2563EB" };
  if (score >= 40) return { word: "Steady",    color: "#EA580C" };
  return               { word: "Off Track", color: "#DC2626" };
}

// ─── SPRING HOOK ──────────────────────────────────────────────────────────────
function useSpring(target, { stiffness = 280, damping = 22 } = {}) {
  const [value, setValue] = useState(target);
  const velRef  = useRef(0);
  const valRef  = useRef(target);
  const rafRef  = useRef(null);

  useEffect(() => {
    const animate = () => {
      const force = (target - valRef.current) * stiffness / 1000;
      velRef.current  = (velRef.current + force) * (1 - damping / 100);
      valRef.current += velRef.current;
      setValue(valRef.current);
      if (Math.abs(valRef.current - target) > 0.01 || Math.abs(velRef.current) > 0.01) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        valRef.current = target;
        setValue(target);
      }
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, stiffness, damping]);

  return value;
}

// ─── COUNT-UP HOOK ────────────────────────────────────────────────────────────
function useCountUp(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    if (prev.current === target) return;
    const start = prev.current;
    const diff  = target - start;
    const began = performance.now();
    const step  = (now) => {
      const t = Math.min(1, (now - began) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplay(Math.round(start + diff * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    prev.current = target;
  }, [target, duration]);
  return display;
}

// ─── CONFETTI BURST ───────────────────────────────────────────────────────────
function ConfettiBurst({ x, y, active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 10 }, (_, i) => {
    const angle  = (i / 10) * 360;
    const dist   = 24 + Math.random() * 16;
    const dx     = Math.cos((angle * Math.PI) / 180) * dist;
    const dy     = Math.sin((angle * Math.PI) / 180) * dist;
    const colors = ["#16A34A", "#2563EB", "#7C3AED", "#EF4444", "#EA580C"];
    const color  = colors[i % colors.length];
    return { dx, dy, color, size: 4 + Math.random() * 3, key: i };
  });
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: 50 }}>
      {pieces.map(p => (
        <div key={p.key} style={{
          position: "absolute",
          width: p.size, height: p.size,
          borderRadius: "50%",
          background: p.color,
          transform: "translate(-50%,-50%)",
          animation: `burst 0.55s cubic-bezier(.4,0,.2,1) forwards`,
          "--dx": `${p.dx}px`, "--dy": `${p.dy}px`,
        }} />
      ))}
    </div>
  );
}

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const css = `
@keyframes burst {
  0%   { transform: translate(-50%,-50%) scale(1); opacity: 1; }
  60%  { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx) * 1.4), calc(-50% + var(--dy) * 1.4)) scale(0); opacity: 0; }
}
@keyframes popIn {
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.18); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes slideUp {
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
::-webkit-scrollbar { width: 0; }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fr(color = "#111") {
  return {
    onFocus: e => { e.currentTarget.style.outline = `2px solid ${color}`; e.currentTarget.style.outlineOffset = "2px"; },
    onBlur:  e => { e.currentTarget.style.outline = "none"; },
  };
}
function Divider() {
  return <div aria-hidden="true" style={{ height: 1, background: C.border }} />;
}
function Label({ children }) {
  return <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.text3, letterSpacing: 1, textTransform: "uppercase" }}>{children}</p>;
}

// ─── PROGRESS BAR (animated) ──────────────────────────────────────────────────
function Bar({ value, max = 100, color = "#111", ariaLabel }) {
  const pct    = Math.round((value / max) * 100);
  const spring = useSpring(pct, { stiffness: 180, damping: 18 });
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={ariaLabel}>
      <div style={{ height: 8, background: C.border, borderRadius: 99, overflow: "hidden" }} aria-hidden="true">
        <div style={{ height: "100%", width: `${spring}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
  );
}

// ─── AI INSIGHT ───────────────────────────────────────────────────────────────
function AIInsight({ text, onDismiss }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 280);
  }
  return (
    <section aria-label="AI insight" style={{
      border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px",
      display: "flex", gap: 12, alignItems: "flex-start", background: C.surface,
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.28s ease, transform 0.28s ease",
    }}>
      <BrainCircuit size={16} color={C.text2} strokeWidth={1.8} aria-hidden="true" style={{ marginTop: 1, flexShrink: 0 }} />
      <p style={{ margin: 0, fontSize: 13, color: C.text2, lineHeight: 1.6, flex: 1 }}>{text}</p>
      {onDismiss && (
        <button onClick={handleDismiss} aria-label="Dismiss AI insight"
          style={{ border: "none", background: "none", cursor: "pointer", color: C.text3, padding: 2, display: "flex" }} {...fr()}>
          <X size={14} />
        </button>
      )}
    </section>
  );
}

// ─── MOMENTUM RING ────────────────────────────────────────────────────────────
function MomentumRing({ score }) {
  const { word, color } = momentumMeta(score);
  const size   = 140;
  const stroke = 11;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const spring = useSpring(score, { stiffness: 120, damping = 16 });
  const count  = useCountUp(score, 800);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${(spring / 100) * circ} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: C.text1, letterSpacing: -2, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{count}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 1 }}>{word.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── HABIT RING ───────────────────────────────────────────────────────────────
function HabitRing({ habit, onToggle }) {
  const [burst, setBurst]   = useState(false);
  const [scale, setScale]   = useState(1);
  const burstRef            = useRef(null);
  const { Icon, streak, goal, done, color, name, id } = habit;
  const pct    = streak / goal;
  const size   = 64;
  const r      = (size - 7) / 2;
  const circ   = 2 * Math.PI * r;
  const spring = useSpring(pct * circ, { stiffness: 160, damping: 18 });

  function handleClick(e) {
    if (!done) {
      setBurst(false);
      requestAnimationFrame(() => setBurst(true));
      setTimeout(() => setBurst(false), 600);
    }
    setScale(0.88);
    setTimeout(() => setScale(1.08), 120);
    setTimeout(() => setScale(1),    220);
    onToggle(id);
  }

  return (
    <div style={{ position: "relative" }}>
      {burst && <ConfettiBurst x={32} y={32} active={burst} />}
      <button onClick={handleClick}
        aria-pressed={done}
        aria-label={`${name}: ${streak}-day streak. ${done ? "Done" : "Not done"}. Tap to toggle.`}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "8px 4px", borderRadius: 10, transform: `scale(${scale})`, transition: "transform 0.15s cubic-bezier(.34,1.56,.64,1)" }}
        {...fr(color)}>
        <div style={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={6} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={done ? color : "#CCCCCC"} strokeWidth={6}
              strokeDasharray={`${spring} ${circ}`} strokeLinecap="round" />
          </svg>
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {done
              ? <div style={{ animation: "popIn 0.3s cubic-bezier(.34,1.56,.64,1) forwards" }}><CheckCircle2 size={22} color={color} strokeWidth={2} /></div>
              : <Icon size={20} color="#BBBBBB" strokeWidth={1.8} />}
          </div>
        </div>
        <span style={{ fontSize: 10, color: done ? C.text1 : C.text3, fontWeight: done ? 600 : 400, textAlign: "center", maxWidth: 62, lineHeight: 1.3 }}>{name}</span>
        <span style={{ fontSize: 10, color: done ? color : C.text3, fontWeight: 600 }}>{streak}d</span>
      </button>
    </div>
  );
}

// ─── TASK ROW ─────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, index }) {
  const [scale, setScale] = useState(1);
  const [burst, setBurst] = useState(false);
  const meta = TYPE_META[task.type];
  const TypeIcon = meta.Icon;

  function handleClick() {
    if (!task.done) {
      setBurst(false);
      requestAnimationFrame(() => setBurst(true));
      setTimeout(() => setBurst(false), 600);
    }
    setScale(0.97);
    setTimeout(() => setScale(1.01), 100);
    setTimeout(() => setScale(1),    180);
    onToggle(task.id);
  }

  return (
    <li style={{ listStyle: "none", position: "relative", animation: `slideUp 0.25s ease ${index * 40}ms both` }}>
      {burst && <ConfettiBurst x={22} y={22} active={burst} />}
      <button onClick={handleClick}
        aria-pressed={task.done}
        aria-label={`${task.title}, ${task.time}, ${meta.label}${task.urgent ? ", urgent" : ""}. ${task.done ? "Completed" : "Pending"}. Tap to toggle.`}
        style={{
          width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 14,
          padding: "14px 0", background: "none", border: "none", borderBottom: `1px solid ${C.border}`,
          cursor: "pointer", opacity: task.done ? 0.35 : 1,
          transform: `scale(${scale})`,
          transition: "opacity 0.3s ease, transform 0.15s cubic-bezier(.34,1.56,.64,1)",
        }}
        {...fr()}>
        <span aria-hidden="true">
          {task.done
            ? <div style={{ animation: "popIn 0.28s cubic-bezier(.34,1.56,.64,1)" }}><CheckCircle2 size={22} color={C.text3} strokeWidth={1.8} /></div>
            : <Circle size={22} color={C.border} strokeWidth={1.8} />}
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 15, color: C.text1, fontWeight: 400, textDecoration: task.done ? "line-through" : "none", transition: "text-decoration 0.2s" }}>
            {task.title}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.text3, marginTop: 3 }}>
            <Clock size={11} strokeWidth={1.8} aria-hidden="true" /> {task.time}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {task.urgent && !task.done && (
            <span role="img" aria-label="Urgent" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: C.danger }}>
              <AlertCircle size={12} strokeWidth={2} aria-hidden="true" />urgent
            </span>
          )}
          <TypeIcon size={13} color={C.text3} strokeWidth={1.6} aria-hidden="true" />
        </span>
      </button>
    </li>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ initials }) {
  return (
    <div aria-hidden="true" style={{ width: 38, height: 38, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, color: C.text1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ─── SCREEN WRAPPER (fade+slide on tab change) ────────────────────────────────
function Screen({ children, id, activeTab }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (activeTab === id) { setVisible(false); requestAnimationFrame(() => setTimeout(() => setVisible(true), 10)); }
  }, [activeTab, id]);
  if (activeTab !== id) return null;
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.22s ease, transform 0.22s ease" }}>
      {children}
    </div>
  );
}

// ─── TODAY ────────────────────────────────────────────────────────────────────
function TodayScreen({ tasks, habits, onToggleTask, onToggleHabit, onTabChange, score }) {
  const [showAI, setShowAI] = useState(true);
  const [aiOut,  setAiOut]  = useState(false);
  const done     = tasks.filter(t => t.done).length;
  const pct      = Math.round((done / tasks.length) * 100);
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const { word, color } = momentumMeta(score);
  const countScore      = useCountUp(score);

  function dismissAI() {
    setAiOut(true);
    setTimeout(() => setShowAI(false), 280);
  }

  return (
    <div>
      <header style={{ padding: "28px 24px 20px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 12, color: C.text3 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 700, color: C.text1, letterSpacing: -0.5 }}>
          {greeting}, Utkarsh
        </h1>

        {/* Momentum pill */}
        <button onClick={() => onTabChange("momentum")}
          aria-label={`Momentum: ${score}, ${word}. Tap to expand.`}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px 8px 10px", border: `1px solid ${C.border}`, borderRadius: 99, background: C.surface, cursor: "pointer", marginBottom: 18, transition: "transform 0.15s cubic-bezier(.34,1.56,.64,1)" }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          {...fr(color)}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{countScore}</span>
          </div>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color, lineHeight: 1 }}>{word}</span>
            <span style={{ fontSize: 10, color: C.text3, lineHeight: 1.5 }}>Momentum · tap for details</span>
          </span>
          <ChevronRight size={13} color={C.text3} strokeWidth={2} aria-hidden="true" />
        </button>

        {/* Progress */}
        <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${done} of ${tasks.length} tasks complete`}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.text3 }}>{done} of {tasks.length} done</span>
            <span style={{ fontSize: 12, color: C.text3 }}>{pct}%</span>
          </div>
          <Bar value={done} max={tasks.length} color={C.text1} ariaLabel="Day progress" />
        </div>
      </header>

      <Divider />

      {showAI && (
        <div style={{ padding: "16px 24px", opacity: aiOut ? 0 : 1, transform: aiOut ? "translateY(-6px)" : "translateY(0)", transition: "opacity 0.25s, transform 0.25s" }}>
          <AIInsight text="3 days smoke-free — best streak this month. 2pm is clear; I shifted gym check-in there. Sarah's email needs a reply before your 4pm call." onDismiss={dismissAI} />
        </div>
      )}
      {showAI && <Divider />}

      <section aria-label="Today's habits" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Label>Habits</Label>
          <button onClick={() => onTabChange("habits")} aria-label="See all habits"
            style={{ fontSize: 12, color: C.text3, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }} {...fr()}>
            All <ChevronRight size={12} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {habits.map(h => <HabitRing key={h.id} habit={h} onToggle={onToggleHabit} />)}
        </div>
      </section>

      <Divider />

      <section aria-label="Today's priorities" style={{ padding: "20px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <Label>Priorities</Label>
          <span style={{ fontSize: 11, color: C.text3, display: "flex", alignItems: "center", gap: 3 }}>
            <Zap size={10} strokeWidth={2} aria-hidden="true" />AI reordered
          </span>
        </div>
        <ul role="list" aria-label="Priority tasks" style={{ margin: 0, padding: 0 }}>
          {tasks.map((t, i) => <TaskRow key={t.id} task={t} onToggle={onToggleTask} index={i} />)}
        </ul>
      </section>
    </div>
  );
}

// ─── HABITS ───────────────────────────────────────────────────────────────────
function HabitsScreen({ habits, onToggle }) {
  return (
    <div style={{ padding: "28px 24px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: C.text1, letterSpacing: -0.5 }}>Habits</h1>
        <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>Tap to log for today</p>
      </header>
      <ul role="list" style={{ margin: 0, padding: 0 }}>
        {habits.map((h, i) => {
          const pct = Math.round((h.streak / h.goal) * 100);
          const { Icon } = h;
          return (
            <li key={h.id} style={{ listStyle: "none", animation: `slideUp 0.25s ease ${i * 50}ms both` }}>
              <button onClick={() => onToggle(h.id)} aria-pressed={h.done}
                aria-label={`${h.name}: ${h.streak}-day streak, ${pct}% of ${h.goal}-day goal. ${h.done ? "Done" : "Not done"}. Tap to toggle.`}
                style={{ width: "100%", textAlign: "left", padding: "18px 0", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "opacity 0.2s" }}
                {...fr(h.color)}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.25s" }} aria-hidden="true">
                    <Icon size={19} color={h.done ? h.color : C.text3} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: C.text1 }}>{h.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.text3, marginTop: 2 }}>
                      <Flame size={11} strokeWidth={1.8} aria-hidden="true" />{h.streak} day streak · goal: {h.goal} days
                    </span>
                  </div>
                  <div style={{ transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1)", transform: h.done ? "scale(1.1)" : "scale(1)" }} aria-hidden="true">
                    {h.done ? <CheckCircle2 size={22} color={h.color} strokeWidth={2} /> : <Circle size={22} color={C.border} strokeWidth={1.8} />}
                  </div>
                </div>
                <Bar value={h.streak} max={h.goal} color={h.done ? h.color : "#CCCCCC"} ariaLabel={`${h.name}: ${pct}%`} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: C.text3 }}>Progress</span>
                  <span style={{ fontSize: 11, color: C.text3 }}>{pct}%</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <div style={{ marginTop: 24 }}>
        <AIInsight text="Most consistent before 9am. Set gym for 7am tomorrow — schedule is clear and your streak is on the line." />
      </div>
    </div>
  );
}

// ─── INBOX ────────────────────────────────────────────────────────────────────
function InboxScreen() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState("All");
  const filters = ["All", "Email", "Calendar", "Docs"];

  return (
    <div style={{ padding: "28px 24px" }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: C.text1, letterSpacing: -0.5 }}>Inbox</h1>
        <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>3 unread · 1 urgent</p>
      </header>
      <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
        <Search size={14} color={C.text3} strokeWidth={1.8} aria-hidden="true" />
        <input type="search" placeholder="Search" aria-label="Search inbox"
          style={{ border: "none", background: "none", fontSize: 14, color: C.text1, outline: "none", flex: 1 }} />
      </div>
      <div role="tablist" aria-label="Filter inbox" style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {filters.map(f => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${filter === f ? C.text1 : C.border}`, background: filter === f ? C.text1 : "none", color: filter === f ? "white" : C.text3, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.18s cubic-bezier(.4,0,.2,1)" }}
            {...fr()}>
            {f}
          </button>
        ))}
      </div>
      <ul role="list" style={{ margin: 0, padding: 0 }}>
        {EMAILS.map((email, i) => (
          <li key={email.id} style={{ listStyle: "none", animation: `slideUp 0.25s ease ${i * 50}ms both` }}>
            <article>
              <button onClick={() => setSelected(selected === email.id ? null : email.id)}
                aria-expanded={selected === email.id}
                aria-label={`${email.unread ? "Unread" : "Read"} from ${email.from}: ${email.subject}${email.urgent ? ", urgent" : ""}. ${email.time}.`}
                style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 0", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                {...fr()}>
                <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
                  <Avatar initials={email.initials} />
                  {email.unread && <span aria-hidden="true" style={{ position: "absolute", top: 1, right: 1, width: 8, height: 8, borderRadius: "50%", background: C.text1, border: "2px solid white" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: email.unread ? 700 : 400, color: C.text1 }}>{email.from}</span>
                    <span style={{ fontSize: 11, color: C.text3 }}>{email.time}</span>
                  </div>
                  <p style={{ margin: "0 0 3px", fontSize: 13, color: email.urgent ? C.danger : C.text1, fontWeight: email.urgent ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.subject}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.preview}</p>
                </div>
              </button>
              <div style={{
                overflow: "hidden", maxHeight: selected === email.id ? 80 : 0,
                transition: "max-height 0.28s cubic-bezier(.4,0,.2,1)",
              }}>
                <div role="group" aria-label={`Actions for ${email.from}`} style={{ display: "flex", gap: 8, padding: "12px 0 16px 52px" }}>
                  {[
                    { label: "Reply",   Icon: CornerUpLeft, primary: true  },
                    { label: "Archive", Icon: Archive,       primary: false },
                    { label: "Defer",   Icon: Clock,         primary: false },
                  ].map(({ label, Icon: Ic, primary }) => (
                    <button key={label} aria-label={`${label} email from ${email.from}`}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: `1px solid ${primary ? C.text1 : C.border}`, background: primary ? C.text1 : "none", color: primary ? "white" : C.text2, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}
                      {...fr()}>
                      <Ic size={13} strokeWidth={1.8} aria-hidden="true" />{label}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── GOALS ────────────────────────────────────────────────────────────────────
function GoalsScreen() {
  return (
    <div style={{ padding: "28px 24px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: C.text1, letterSpacing: -0.5 }}>North Stars</h1>
        <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>Your 2025 goals</p>
      </header>
      <ul role="list" style={{ margin: 0, padding: 0 }}>
        {GOALS.map((g, i) => {
          const { Icon: GIcon } = g;
          const up = g.momentum > 0;
          return (
            <li key={g.id} style={{ listStyle: "none", animation: `slideUp 0.25s ease ${i * 60}ms both` }}>
              <div style={{ padding: "18px 0", borderBottom: `1px solid ${C.border}` }}
                role="region" aria-label={`${g.title}: ${g.pct}% complete. Momentum ${up ? `up ${g.momentum}` : `down ${Math.abs(g.momentum)}`} points.`}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
                    <GIcon size={18} color={C.text2} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: C.text1 }}>{g.title}</span>
                    <span style={{ display: "block", fontSize: 12, color: C.text3, marginTop: 1 }}>{g.desc}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.text1 }}>{g.pct}%</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, color: up ? "#16A34A" : C.danger, justifyContent: "flex-end", marginTop: 1 }} aria-hidden="true">
                      {up ? <TrendingUp size={11} strokeWidth={2} /> : <TrendingDown size={11} strokeWidth={2} />}
                      {up ? "+" : ""}{g.momentum}
                    </span>
                  </div>
                </div>
                <Bar value={g.pct} max={100} color={g.color} ariaLabel={`${g.title}: ${g.pct}%`} />
              </div>
            </li>
          );
        })}
      </ul>
      <div style={{ marginTop: 24 }}>
        <AIInsight text="On track with 3 of 4. Sleep is dipping — a consistent 10pm bedtime this week would flip it back to positive momentum." />
      </div>
      <button aria-label="Add a new goal"
        style={{ marginTop: 16, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "none", cursor: "pointer", color: C.text3, fontSize: 13, fontWeight: 500 }}
        {...fr()}>
        <Plus size={15} strokeWidth={2} aria-hidden="true" />Add goal
      </button>
    </div>
  );
}

// ─── MOMENTUM SCREEN ──────────────────────────────────────────────────────────
function MomentumScreen({ score, tasks, habits }) {
  const { word, color } = momentumMeta(score);
  const doneT  = tasks.filter(t => t.done).length;
  const doneH  = habits.filter(h => h.done).length;
  const hPts   = habits.filter(h => h.done).reduce((s, h) => s + h.points, 0);
  const hist   = [42, 48, 55, 51, 60, 58, score];
  const days   = ["M", "T", "W", "T", "F", "S", "Now"];
  const maxH   = Math.max(...hist);
  const minH   = Math.min(...hist);

  return (
    <div style={{ padding: "28px 24px" }}>
      <header style={{ marginBottom: 28 }}>
        <Label>Momentum Score</Label>
        <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700, color: C.text1, letterSpacing: -0.5 }}>Your Life Pulse</h1>
        <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>How aligned you are with your goals, right now</p>
      </header>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <MomentumRing score={score} />
      </div>

      <Divider />

      <div style={{ padding: "20px 0" }}>
        <Label>This week</Label>

        {/* Bar chart */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 64, marginTop: 16, marginBottom: 20 }}>
          {hist.map((val, i) => {
            const h      = ((val - minH) / (maxH - minH + 1)) * 48 + 14;
            const today  = i === hist.length - 1;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ width: "100%", height: h, background: today ? color : C.border, borderRadius: 5, transition: "height 0.5s cubic-bezier(.4,0,.2,1)" }} aria-hidden="true" />
                <span style={{ fontSize: 9, color: today ? C.text1 : C.text3, fontWeight: today ? 700 : 400 }}>{days[i]}</span>
              </div>
            );
          })}
        </div>

        <Divider />

        {[
          { label: "Tasks completed", value: `${doneT} / ${tasks.length}`,  sub: `+${doneT * 8} pts`  },
          { label: "Habits logged",   value: `${doneH} / ${habits.length}`, sub: `+${hPts} pts`        },
          { label: "Streak bonus",    value: "7 days",                       sub: "+14 pts"             },
        ].map((s, i) => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.border}`, animation: `slideUp 0.25s ease ${i * 60}ms both` }}>
            <span style={{ fontSize: 14, color: C.text2 }}>{s.label}</span>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text1 }}>{s.value}</span>
              <span style={{ display: "block", fontSize: 11, color: "#16A34A" }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        <AIInsight text={`Score: ${score} — ${word}. Log your remaining 2 habits today to push to ${Math.min(100, score + 18)}, your highest this week.`} />
      </div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "today",    Icon: LayoutDashboard, label: "Today"   },
  { id: "habits",   Icon: Activity,        label: "Habits"  },
  { id: "inbox",    Icon: Inbox,           label: "Inbox"   },
  { id: "goals",    Icon: Compass,         label: "Goals"   },
  { id: "momentum", Icon: Zap,             label: "Pulse"   },
];

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function NorthApp() {
  const [activeTab, setActiveTab] = useState("today");
  const [tasks,  setTasks]  = useState(TASKS_INIT);
  const [habits, setHabits] = useState(HABITS_INIT);
  const [time,   setTime]   = useState(new Date());
  const [prevTab, setPrevTab] = useState("today");

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleTask  = useCallback(id => setTasks(ts  => ts.map(t => t.id === id ? { ...t, done: !t.done } : t)), []);
  const toggleHabit = useCallback(id => setHabits(hs => hs.map(h => h.id === id ? { ...h, done: !h.done } : h)), []);

  function changeTab(tab) { setPrevTab(activeTab); setActiveTab(tab); }

  const score = calcMomentum(tasks, habits);

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: "#EBEBEB", display: "flex", justifyContent: "center", alignItems: "center", padding: "24px 0", fontFamily: "'SF Pro Text',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif" }}>
        <a href="#main-content"
          style={{ position: "absolute", top: -40, left: 8, background: C.text1, color: "white", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, zIndex: 9999, textDecoration: "none" }}
          onFocus={e => e.currentTarget.style.top = "8px"}
          onBlur={e => e.currentTarget.style.top = "-40px"}>
          Skip to main content
        </a>

        <div role="application" aria-label="NORTH productivity app"
          style={{ width: 390, minHeight: 844, background: C.bg, borderRadius: 52, boxShadow: "0 30px 80px rgba(0,0,0,0.15), 0 0 0 10px #1C1C1E, 0 0 0 12px #3A3A3C", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>

          {/* Status bar */}
          <div aria-hidden="true" style={{ padding: "14px 28px 0", display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: C.text1, position: "relative", flexShrink: 0 }}>
            <span>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <div style={{ width: 120, height: 32, background: "#1C1C1E", borderRadius: 20, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 0 }} />
            <span style={{ fontSize: 11 }}>●●● 100%</span>
          </div>

          <main id="main-content" style={{ flex: 1, overflowY: "auto", paddingBottom: 88 }}>
            <Screen id="today"    activeTab={activeTab}><TodayScreen tasks={tasks} habits={habits} onToggleTask={toggleTask} onToggleHabit={toggleHabit} onTabChange={changeTab} score={score} /></Screen>
            <Screen id="habits"   activeTab={activeTab}><HabitsScreen habits={habits} onToggle={toggleHabit} /></Screen>
            <Screen id="inbox"    activeTab={activeTab}><InboxScreen /></Screen>
            <Screen id="goals"    activeTab={activeTab}><GoalsScreen /></Screen>
            <Screen id="momentum" activeTab={activeTab}><MomentumScreen score={score} tasks={tasks} habits={habits} /></Screen>
          </main>

          {/* Bottom nav */}
          <nav aria-label="Main navigation"
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.97)", borderTop: `1px solid ${C.border}`, padding: "10px 0 22px", display: "flex", justifyContent: "space-around" }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              const { Icon: TabIcon } = tab;
              return (
                <button key={tab.id} onClick={() => changeTab(tab.id)}
                  aria-current={active ? "page" : undefined}
                  aria-label={tab.label}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer", padding: "4px 10px", borderRadius: 8, transition: "transform 0.15s cubic-bezier(.34,1.56,.64,1)" }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.88)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  {...fr()}>
                  <TabIcon size={20} color={active ? C.text1 : C.text3} strokeWidth={active ? 2.2 : 1.6} aria-hidden="true" />
                  <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, color: active ? C.text1 : C.text3 }}>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}