import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell, ComposedChart, Area, Line
} from "recharts";

/* ── constants ── */
const C = {
  bg: "#08080c",
  card: "rgba(255,255,255,0.018)",
  border: "rgba(255,255,255,0.055)",
  text: "#e2e2e8",
  muted: "#6b6b78",
  dim: "#3a3a48",
  green: "#34d399",
  red: "#f87171",
  amber: "#fbbf24",
  blue: "#60a5fa",
  violet: "#a78bfa",
  cyan: "#22d3ee",
};

const PRESETS = [
  { key: "nifty_bull", label: "Nifty Bull '20–24", icon: "🐂", entryPE: 18, exitPE: 24, eg: 14, yrs: 4, mode: "pe", yield: 0, desc: "Post-COVID re-rating" },
  { key: "nifty_08", label: "Nifty '08 Crash", icon: "💥", entryPE: 28, exitPE: 12, eg: 8, yrs: 1, mode: "pe", yield: 0, desc: "GFC de-rating" },
  { key: "midcap", label: "Midcap Re-rate", icon: "🚀", entryPE: 12, exitPE: 25, eg: 20, yrs: 3, mode: "pe", yield: 0, desc: "Discovery to darling" },
  { key: "trap", label: "Value Trap", icon: "🪤", entryPE: 8, exitPE: 6, eg: 2, yrs: 5, mode: "pe", yield: 0, desc: "Cheap stays cheap" },
  { key: "compounder", label: "Quality Compounder", icon: "⚡", entryPE: 35, exitPE: 30, eg: 25, yrs: 5, mode: "pe", yield: 0, desc: "Earnings carry the weight" },
  { key: "mindspace", label: "Mindspace REIT", icon: "🏢", entryPE: 18, exitPE: 20, eg: 8, yrs: 4, mode: "pffo", yield: 6.5, desc: "P/FFO + DPU yield" },
  { key: "nexus", label: "Nexus Select", icon: "🛍️", entryPE: 22, exitPE: 26, eg: 12, yrs: 3, mode: "pffo", yield: 5.2, desc: "Retail REIT re-rating" },
  { key: "invit", label: "InvIT Stable", icon: "🛣️", entryPE: 10, exitPE: 11, eg: 5, yrs: 5, mode: "pffo", yield: 9, desc: "Yield + mild growth" },
];

/* ── math engine ── */
function compute({ entryPE, exitPE, eg, yrs, peShape = "linear" }) {
  const d = [];
  const base = 100;
  const p0 = base * entryPE;
  for (let y = 0; y <= yrs; y++) {
    const eps = base * Math.pow(1 + eg / 100, y);
    let t = y / Math.max(yrs, 1);
    if (peShape === "front") t = Math.pow(t, 0.5);
    else if (peShape === "back") t = Math.pow(t, 2);
    const pe = entryPE + (exitPE - entryPE) * t;
    const price = eps * pe;
    const tr = ((price / p0) - 1) * 100;
    const er = ((eps / base) - 1) * 100;
    d.push({
      year: y, eps: +eps.toFixed(2), pe: +pe.toFixed(1),
      price: +price.toFixed(0), tr: +tr.toFixed(1),
      er: +er.toFixed(1), per: +(tr - er).toFixed(1),
    });
  }
  return d;
}

function calcIRR(e, x, y) { return y === 0 ? 0 : (Math.pow(x / e, 1 / y) - 1) * 100; }

function totalReturnWithYield({ entryPE, exitPE, eg, yrs, annualYield, peShape }) {
  const data = compute({ entryPE, exitPE, eg, yrs, peShape });
  const fin = data[data.length - 1];
  const priceCAGR = calcIRR(100 * entryPE, fin.price, yrs);
  return { data, fin, priceCAGR, totalCAGR: priceCAGR + annualYield, annualYield };
}

/* ── animated number (fixed stale closure) ── */
function AnimNum({ value, suffix = "", prefix = "", color, size = 42 }) {
  const [display, setDisplay] = useState(value);
  const currentRef = useRef(value);
  const startRef = useRef(value);

  useEffect(() => {
    startRef.current = currentRef.current;
    const target = value;
    let frame = 0;
    const total = 25;
    const tick = () => {
      frame++;
      const p = Math.min(frame / total, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = startRef.current + (target - startRef.current) * eased;
      currentRef.current = v;
      setDisplay(v);
      if (frame < total) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span style={{
      fontFamily: "'Cormorant Garamond', serif", fontSize: size, fontWeight: 700,
      color, lineHeight: 1, letterSpacing: "-0.03em",
      fontVariantNumeric: "tabular-nums",
    }}>
      {prefix}{display.toFixed(1)}{suffix}
    </span>
  );
}

/* ── radial gauge (dynamic range) ── */
function Gauge({ value, label }) {
  const max = Math.max(40, Math.ceil(value / 10) * 10 + 10);
  const min = Math.min(-20, Math.floor(value / 10) * 10 - 10);
  const clamped = Math.max(min, Math.min(max, value));
  const pct = (clamped - min) / (max - min);
  const angle = -140 + pct * 280;
  const r = 72, cx = 90, cy = 90;

  const arc = (sa, ea) => {
    const s = (sa - 90) * Math.PI / 180, e = (ea - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${ea - sa > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };

  const na = (angle - 90) * Math.PI / 180;
  const nx = cx + (r - 14) * Math.cos(na), ny = cy + (r - 14) * Math.sin(na);
  const gc = value >= 15 ? C.green : value >= 8 ? C.amber : value >= 0 ? "#fb923c" : C.red;

  return (
    <svg width="180" height="120" viewBox="0 0 180 130" style={{ display: "block", margin: "0 auto" }}>
      <defs>
        <linearGradient id="gg" x1="0%" y1="0%" x2="100%"><stop offset="0%" stopColor={C.red}/><stop offset="35%" stopColor="#fb923c"/><stop offset="50%" stopColor={C.amber}/><stop offset="75%" stopColor={C.green}/><stop offset="100%" stopColor="#059669"/></linearGradient>
        <filter id="gl"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <path d={arc(-140, 140)} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" strokeLinecap="round"/>
      <path d={arc(-140, Math.min(angle, 140))} fill="none" stroke="url(#gg)" strokeWidth="10" strokeLinecap="round" filter="url(#gl)" style={{ transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)" }}/>
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={gc} strokeWidth="2" strokeLinecap="round" filter="url(#gl)" style={{ transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)" }}/>
      <circle cx={cx} cy={cy} r="4" fill={gc} filter="url(#gl)"/>
      <text x="20" y="125" fill="#444" fontSize="8" fontFamily="'Outfit',sans-serif">{min}%</text>
      <text x="148" y="125" fill="#444" fontSize="8" fontFamily="'Outfit',sans-serif">{max}%</text>
      <text x={cx} y="128" textAnchor="middle" fill="#555" fontSize="8" fontFamily="'Outfit',sans-serif" letterSpacing="0.1em">{label}</text>
    </svg>
  );
}

/* ── PE spectrum ── */
function PESpectrum({ entry, exit }) {
  const accent = exit > entry ? C.green : exit < entry ? C.red : C.amber;
  const ePos = Math.min(96, Math.max(4, (entry / 80) * 100));
  const xPos = Math.min(96, Math.max(4, (exit / 80) * 100));
  return (
    <div style={{ position: "relative", marginBottom: 32 }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>PE Spectrum</div>
      <div style={{ position: "relative", height: 40, borderRadius: 20, overflow: "visible", background: "linear-gradient(90deg, #065f46 0%, #059669 15%, #d97706 35%, #dc2626 60%, #7f1d1d 100%)", border: `1px solid ${C.border}` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: "rgba(0,0,0,0.55)" }}/>
        {/* connector */}
        {Math.abs(exit - entry) > 1 && <div style={{ position: "absolute", top: "50%", height: 2, transform: "translateY(-50%)", left: `${Math.min(ePos, xPos)}%`, width: `${Math.abs(xPos - ePos)}%`, background: `linear-gradient(90deg, #818cf8, ${accent})`, opacity: 0.5, transition: "all 0.3s" }}/>}
        {/* entry */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${ePos}%`, width: 3, background: "#818cf8", borderRadius: 2, boxShadow: "0 0 10px #818cf860", transition: "left 0.3s" }}>
          <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: 9, fontWeight: 700, color: "#818cf8", background: C.bg, padding: "2px 7px", borderRadius: 6, border: "1px solid #818cf830" }}>IN {entry}×</div>
        </div>
        {/* exit */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${xPos}%`, width: 3, background: accent, borderRadius: 2, boxShadow: `0 0 10px ${accent}60`, transition: "left 0.3s" }}>
          <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: 9, fontWeight: 700, color: accent, background: C.bg, padding: "2px 7px", borderRadius: 6, border: `1px solid ${accent}30` }}>OUT {exit}×</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26, fontSize: 8, color: "#333", letterSpacing: "0.05em" }}>
        <span>Deep Value</span><span>Fair</span><span>Rich</span><span>Euphoria</span>
      </div>
    </div>
  );
}

/* ── heatmap cell ── */
function HC({ v, sel }) {
  const bg = v >= 20 ? "rgba(52,211,153,0.35)" : v >= 15 ? "rgba(52,211,153,0.2)" : v >= 10 ? "rgba(251,191,36,0.18)" : v >= 5 ? "rgba(251,146,60,0.12)" : v >= 0 ? "rgba(251,146,60,0.2)" : "rgba(248,113,113,0.25)";
  const c = v >= 15 ? C.green : v >= 8 ? C.amber : v >= 0 ? "#fb923c" : C.red;
  return (
    <td style={{
      padding: "6px 4px", textAlign: "center", fontSize: 10.5, fontWeight: sel ? 800 : 500,
      fontFamily: "'Outfit',sans-serif", color: sel ? "#fff" : c,
      background: sel ? `${c}40` : bg,
      border: sel ? `2px solid ${c}` : `1px solid rgba(255,255,255,0.02)`,
      borderRadius: sel ? 4 : 0, transition: "all 0.2s",
      fontVariantNumeric: "tabular-nums",
    }}>
      {v >= 0 ? "+" : ""}{v.toFixed(1)}
    </td>
  );
}

/* ── slider ── */
function Slider({ label, value, min, max, step, onChange, unit, accent, icon, sub }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{icon} {label}</span>
          {sub && <span style={{ fontSize: 9, color: C.dim, marginLeft: 8 }}>{sub}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value}</span>
          <span style={{ fontSize: 12, color: C.dim }}>{unit}</span>
        </div>
      </div>
      <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)" }}/>
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${accent}50, ${accent})`, transition: "width 0.05s" }}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: "absolute", width: "100%", height: 28, opacity: 0, cursor: "pointer", zIndex: 2 }}/>
        <div style={{
          position: "absolute", left: `calc(${pct}% - 8px)`, width: 16, height: 16,
          borderRadius: "50%", background: accent, border: `3px solid ${C.bg}`,
          boxShadow: `0 0 12px ${accent}50`, transition: "left 0.05s", pointerEvents: "none",
        }}/>
      </div>
    </div>
  );
}

/* ── tooltip ── */
function TT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,8,12,0.95)", border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "12px 16px", fontFamily: "'Outfit',sans-serif",
      fontSize: 11, backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <div style={{ fontWeight: 700, color: C.text, marginBottom: 6, fontSize: 12 }}>Year {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 18, marginBottom: 2, color: p.color }}>
          <span style={{ opacity: 0.7 }}>{p.name}</span>
          <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── mini metric ── */
function Metric({ label, value, color, small }) {
  return (
    <div style={{
      flex: 1, background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: small ? "8px 6px" : "10px 8px",
      border: `1px solid ${C.border}`, minWidth: 0,
    }}>
      <div style={{ fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: small ? 15 : 17, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function PEReturnMachine() {
  const [mode, setMode] = useState("pe"); // pe | pffo
  const [entryPE, setEntryPE] = useState(20);
  const [exitPE, setExitPE] = useState(20);
  const [eg, setEg] = useState(12);
  const [yrs, setYrs] = useState(3);
  const [dyield, setDyield] = useState(0);
  const [peShape, setPeShape] = useState("linear");
  const [tab, setTab] = useState("decompose");
  const [preset, setPreset] = useState(null);
  const [compare, setCompare] = useState(false);
  const [entryPE2, setEntryPE2] = useState(25);
  const [exitPE2, setExitPE2] = useState(22);
  const [eg2, setEg2] = useState(10);
  const [dyield2, setDyield2] = useState(5);
  const [label1, setLabel1] = useState("Stock A");
  const [label2, setLabel2] = useState("Stock B");
  const exportRef = useRef(null);

  const apply = useCallback((p) => {
    setPreset(p.key);
    setEntryPE(p.entryPE); setExitPE(p.exitPE); setEg(p.eg); setYrs(p.yrs);
    setMode(p.mode); setDyield(p.yield);
    setLabel1(p.label);
  }, []);

  // Primary computation
  const r1 = useMemo(() => totalReturnWithYield({ entryPE, exitPE, eg, yrs, annualYield: mode === "pffo" ? dyield : 0, peShape }), [entryPE, exitPE, eg, yrs, dyield, mode, peShape]);
  // Compare computation
  const r2 = useMemo(() => compare ? totalReturnWithYield({ entryPE: entryPE2, exitPE: exitPE2, eg: eg2, yrs, annualYield: mode === "pffo" ? dyield2 : 0, peShape }) : null, [compare, entryPE2, exitPE2, eg2, yrs, dyield2, mode, peShape]);

  const isUp = exitPE > entryPE;
  const isDown = exitPE < entryPE;
  const accent = isUp ? C.green : isDown ? C.red : C.amber;

  const verdict = r1.totalCAGR >= 20 ? { t: "EXCEPTIONAL", s: "Generational entry point. Size it meaningfully.", e: "🔥", c: C.green }
    : r1.totalCAGR >= 15 ? { t: "STRONG", s: "Compelling risk-reward. Conviction-worthy.", e: "⚡", c: C.green }
    : r1.totalCAGR >= 10 ? { t: "FAIR VALUE", s: "Decent but priced for perfection.", e: "👍", c: C.amber }
    : r1.totalCAGR >= 5 ? { t: "MUTED", s: "Mediocre reward for equity risk.", e: "😐", c: "#fb923c" }
    : r1.totalCAGR >= 0 ? { t: "WEAK", s: "Barely beating FD rates.", e: "⚠️", c: "#fb923c" }
    : { t: "CAPITAL DESTROYER", s: "Negative real returns. Walk away.", e: "🚨", c: C.red };

  // Annual decomposition
  const annualD = useMemo(() => r1.data.slice(1).map((d, i) => {
    const prev = r1.data[i].price;
    const yr = ((d.price - prev) / prev) * 100;
    const epsg = ((d.eps - r1.data[i].eps) / r1.data[i].eps) * 100;
    const yieldR = mode === "pffo" ? dyield : 0;
    return { year: `Y${d.year}`, earnings: +epsg.toFixed(1), pe: +(yr - epsg).toFixed(1), yield: +yieldR.toFixed(1), total: +(yr + yieldR).toFixed(1) };
  }), [r1.data, mode, dyield]);

  // Heatmap
  const heatmap = useMemo(() => {
    const eps = [6, 8, 10, 12, 15, 18, 20, 22, 25, 30, 35, 40];
    const gs = [0, 5, 8, 10, 12, 15, 18, 20, 25, 30];
    const yld = mode === "pffo" ? dyield : 0;
    const mx = gs.map(g => eps.map(ep => {
      const d = compute({ entryPE, exitPE: ep, eg: g, yrs, peShape });
      return +(calcIRR(100 * entryPE, d[d.length - 1].price, yrs) + yld).toFixed(1);
    }));
    return { eps, gs, mx };
  }, [entryPE, yrs, mode, dyield, peShape]);

  // Compare data for chart
  const compareChartData = useMemo(() => {
    if (!compare || !r2) return null;
    return r1.data.map((d, i) => ({
      year: d.year,
      price1: d.price,
      price2: r2.data[i]?.price ?? 0,
      pe1: d.pe,
      pe2: r2.data[i]?.pe ?? 0,
    }));
  }, [compare, r1.data, r2]);

  const modeLabel = mode === "pffo" ? "P/FFO" : "PE";
  const earningsLabel = mode === "pffo" ? "FFO Growth" : "Earnings CAGR";

  const tabs = [
    { key: "decompose", label: "Decompose", icon: "◧" },
    { key: "trajectory", label: "Trajectory", icon: "◠" },
    { key: "heatmap", label: "Heatmap", icon: "▦" },
    ...(compare ? [{ key: "compare", label: "Compare", icon: "⚖" }] : []),
  ];

  return (
    <div ref={exportRef} style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'Outfit', sans-serif", position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes slideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes breathe { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        .si { opacity:0; animation: slideIn 0.5s ease forwards; }
        .d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}
        .d4{animation-delay:.2s}.d5{animation-delay:.25s}.d6{animation-delay:.3s}.d7{animation-delay:.35s}
        .pill { transition: all 0.2s ease; cursor: pointer; user-select: none; }
        .pill:hover { transform: translateY(-1px); }
        .pill:active { transform: scale(0.97); }
        * { box-sizing: border-box; margin:0; padding:0; }
        input[type=range] { -webkit-appearance:none; appearance:none; }

        /* grain overlay */
        .grain::after {
          content: ''; position: fixed; inset: 0; z-index: 9999; pointer-events: none; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="grain" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}/>

      {/* ── HEADER ── */}
      <div className="si d1" style={{
        padding: "32px 24px 24px", position: "relative",
        borderBottom: `1px solid ${C.border}`,
        backgroundImage: `radial-gradient(ellipse at 30% 0%, ${accent}08 0%, transparent 60%)`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                padding: "3px 12px", borderRadius: 16,
                background: `${accent}12`, border: `1px solid ${accent}25`,
                fontSize: 10, fontWeight: 700, color: accent, letterSpacing: "0.1em",
                animation: "breathe 3s ease infinite",
              }}>
                {isUp ? "▲ RE-RATING" : isDown ? "▼ DE-RATING" : "● NEUTRAL"}
              </div>
              <div style={{
                padding: "3px 12px", borderRadius: 16,
                background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.06em",
              }}>
                {mode === "pffo" ? "P/FFO + DPU" : "PE MODE"}
              </div>
            </div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700,
              lineHeight: 1.05, letterSpacing: "-0.02em",
            }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic", fontWeight: 400, fontSize: 22 }}>The</span><br/>
              <span style={{
                background: `linear-gradient(135deg, ${accent}, #f5f5f5, ${accent})`,
                backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                animation: "shimmer 5s linear infinite",
              }}>{mode === "pffo" ? "REIT Return" : "PE Return"}</span><br/>
              Machine
            </h1>
          </div>
        </div>
        <p style={{ fontSize: 12, color: C.dim, marginTop: 8, maxWidth: 380, lineHeight: 1.6, fontWeight: 300 }}>
          Decompose returns into earnings growth{mode === "pffo" ? ", distribution yield," : ""} and multiple {isUp ? "expansion" : isDown ? "compression" : "change"}.
        </p>
      </div>

      <div style={{ padding: "20px 24px 48px" }}>
        {/* ── MODE TOGGLE ── */}
        <div className="si d2" style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["pe", "pffo"].map(m => (
            <button key={m} className="pill" onClick={() => { setMode(m); if (m === "pe") setDyield(0); else if (dyield === 0) setDyield(5); }}
              style={{
                flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${mode === m ? accent + "40" : C.border}`,
                background: mode === m ? `${accent}10` : "transparent",
                color: mode === m ? C.text : C.muted, fontSize: 12, fontWeight: mode === m ? 700 : 400,
                fontFamily: "'Outfit',sans-serif",
              }}>
              {m === "pe" ? "🏛 PE · Equity" : "🏢 P/FFO · REIT/InvIT"}
            </button>
          ))}
        </div>

        {/* ── COMPARE TOGGLE ── */}
        <div className="si d2" style={{ marginBottom: 16 }}>
          <button className="pill" onClick={() => setCompare(!compare)}
            style={{
              width: "100%", padding: "10px", borderRadius: 10,
              border: `1px solid ${compare ? C.violet + "40" : C.border}`,
              background: compare ? `${C.violet}10` : "transparent",
              color: compare ? C.text : C.muted, fontSize: 12,
              fontWeight: compare ? 700 : 400, fontFamily: "'Outfit',sans-serif",
            }}>
            ⚖ {compare ? "Comparing Two Securities" : "Enable Side-by-Side Compare"}
          </button>
        </div>

        {/* ── PRESETS ── */}
        <div className="si d3" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: "0.12em", marginBottom: 8 }}>SCENARIOS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PRESETS.filter(p => mode === "pe" ? p.mode === "pe" : true).map(p => (
              <button key={p.key} className="pill" onClick={() => apply(p)} style={{
                padding: "6px 12px", borderRadius: 16,
                background: preset === p.key ? `${accent}12` : "rgba(255,255,255,0.02)",
                border: `1px solid ${preset === p.key ? accent + "35" : C.border}`,
                color: preset === p.key ? C.text : C.muted, fontSize: 11, fontWeight: preset === p.key ? 700 : 400,
                fontFamily: "'Outfit',sans-serif",
              }}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── INPUTS ── */}
        <div className="si d4" style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
          padding: "20px 20px 6px", marginBottom: 20,
        }}>
          {compare && <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginBottom: 10, letterSpacing: "0.06em" }}>
            <input value={label1} onChange={e=>setLabel1(e.target.value)} style={{ background:"transparent", border:"none", color:C.blue, fontWeight:700, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", width:120 }} /> — PRIMARY
          </div>}
          <Slider label={`Entry ${modeLabel}`} icon="◉" value={entryPE} min={3} max={80} step={0.5} onChange={v => { setEntryPE(v); setPreset(null); }} unit="×" accent="#818cf8"/>
          <Slider label={`Exit ${modeLabel}`} icon="◎" value={exitPE} min={3} max={80} step={0.5} onChange={v => { setExitPE(v); setPreset(null); }} unit="×" accent={accent}/>
          <Slider label={earningsLabel} icon="↗" value={eg} min={-20} max={50} step={1} onChange={v => { setEg(v); setPreset(null); }} unit="%" accent={C.blue}/>
          <Slider label="Holding Period" icon="⏱" value={yrs} min={1} max={15} step={1} onChange={v => { setYrs(v); setPreset(null); }} unit=" yr" accent={C.violet}/>
          {mode === "pffo" && (
            <Slider label="Distribution Yield" icon="💰" value={dyield} min={0} max={15} step={0.1} onChange={v => { setDyield(v); setPreset(null); }} unit="%" accent={C.cyan} sub="Annual DPU yield"/>
          )}
          {/* PE Shape */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", alignSelf: "center", marginRight: 6 }}>PE Path</div>
            {["front", "linear", "back"].map(s => (
              <button key={s} className="pill" onClick={() => setPeShape(s)} style={{
                padding: "5px 12px", borderRadius: 8, fontSize: 10,
                background: peShape === s ? "rgba(255,255,255,0.06)" : "transparent",
                border: `1px solid ${peShape === s ? "rgba(255,255,255,0.12)" : C.border}`,
                color: peShape === s ? C.text : C.dim, fontFamily: "'Outfit',sans-serif", fontWeight: peShape === s ? 600 : 400,
              }}>
                {s === "front" ? "⤴ Front-loaded" : s === "back" ? "⤵ Back-loaded" : "→ Linear"}
              </button>
            ))}
          </div>
        </div>

        {/* ── COMPARE INPUTS ── */}
        {compare && (
          <div className="si" style={{
            background: C.card, border: `1px solid ${C.violet}20`, borderRadius: 16,
            padding: "20px 20px 6px", marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.violet, marginBottom: 10, letterSpacing: "0.06em" }}>
              <input value={label2} onChange={e=>setLabel2(e.target.value)} style={{ background:"transparent", border:"none", color:C.violet, fontWeight:700, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", width:120 }} /> — COMPARE
            </div>
            <Slider label={`Entry ${modeLabel}`} icon="◉" value={entryPE2} min={3} max={80} step={0.5} onChange={setEntryPE2} unit="×" accent={C.violet}/>
            <Slider label={`Exit ${modeLabel}`} icon="◎" value={exitPE2} min={3} max={80} step={0.5} onChange={setExitPE2} unit="×" accent={C.violet}/>
            <Slider label={earningsLabel} icon="↗" value={eg2} min={-20} max={50} step={1} onChange={setEg2} unit="%" accent={C.violet}/>
            {mode === "pffo" && (
              <Slider label="Distribution Yield" icon="💰" value={dyield2} min={0} max={15} step={0.1} onChange={setDyield2} unit="%" accent={C.violet}/>
            )}
          </div>
        )}

        {/* ── VERDICT ── */}
        <div className="si d5" style={{
          background: `linear-gradient(135deg, ${verdict.c}06, rgba(255,255,255,0.01), ${verdict.c}03)`,
          border: `1px solid ${verdict.c}20`, borderRadius: 16, padding: "20px", marginBottom: 20,
          textAlign: "center", position: "relative", overflow: "hidden",
        }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>{verdict.e}</div>
          <div style={{
            fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700,
            color: verdict.c, letterSpacing: "0.04em", marginBottom: 2,
          }}>{verdict.t}</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>{verdict.s}</div>

          <Gauge value={r1.totalCAGR} label="TOTAL CAGR"/>

          <div style={{ marginTop: 4 }}>
            <AnimNum value={r1.totalCAGR} suffix="%" prefix={r1.totalCAGR >= 0 ? "+" : ""} color={verdict.c} size={38}/>
            <div style={{ fontSize: 9, color: C.dim, marginTop: 4, letterSpacing: "0.1em" }}>
              ANNUALIZED TOTAL RETURN{mode === "pffo" ? " (incl. DPU)" : ""}
            </div>
          </div>

          {/* Mini metrics */}
          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            <Metric label="Total" value={`${r1.fin.tr >= 0 ? "+" : ""}${r1.fin.tr.toFixed(0)}%`} color={r1.fin.tr >= 0 ? C.text : C.red} small/>
            <Metric label="From Earnings" value={`+${r1.fin.er.toFixed(0)}%`} color={C.blue} small/>
            <Metric label={`From ${modeLabel}`} value={`${r1.fin.per >= 0 ? "+" : ""}${r1.fin.per.toFixed(0)}%`} color={r1.fin.per >= 0 ? C.green : C.red} small/>
            {mode === "pffo" && <Metric label="DPU Yield" value={`+${(dyield * yrs).toFixed(0)}%`} color={C.cyan} small/>}
            <Metric label={`${modeLabel} Δ`} value={`${entryPE}→${exitPE}×`} color={accent} small/>
          </div>

          {/* Compare summary */}
          {compare && r2 && (
            <div style={{
              marginTop: 16, padding: "12px", borderRadius: 10,
              background: "rgba(0,0,0,0.3)", border: `1px solid ${C.violet}20`,
            }}>
              <div style={{ fontSize: 9, color: C.violet, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>VS {label2.toUpperCase()}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <Metric label="CAGR" value={`${r2.totalCAGR >= 0 ? "+" : ""}${r2.totalCAGR.toFixed(1)}%`} color={r2.totalCAGR >= 15 ? C.green : r2.totalCAGR >= 0 ? C.amber : C.red} small/>
                <Metric label="Total" value={`${r2.fin.tr >= 0 ? "+" : ""}${r2.fin.tr.toFixed(0)}%`} color={C.violet} small/>
                <Metric label="PE Δ" value={`${entryPE2}→${exitPE2}×`} color={C.violet} small/>
                <Metric label="Spread" value={`${(r1.totalCAGR - r2.totalCAGR) >= 0 ? "+" : ""}${(r1.totalCAGR - r2.totalCAGR).toFixed(1)}%`} color={(r1.totalCAGR - r2.totalCAGR) >= 0 ? C.green : C.red} small/>
              </div>
            </div>
          )}
        </div>

        {/* ── PE SPECTRUM ── */}
        <div className="si d6">
          <PESpectrum entry={entryPE} exit={exitPE}/>
        </div>

        {/* ── TABS ── */}
        <div className="si d7" style={{
          display: "flex", gap: 3, background: "rgba(255,255,255,0.015)", borderRadius: 12, padding: 3, marginBottom: 20,
        }}>
          {tabs.map(t => (
            <button key={t.key} className="pill" onClick={() => setTab(t.key)} style={{
              flex: 1, padding: "10px 6px", borderRadius: 9,
              background: tab === t.key ? "rgba(255,255,255,0.06)" : "transparent",
              border: tab === t.key ? `1px solid rgba(255,255,255,0.08)` : "1px solid transparent",
              color: tab === t.key ? C.text : C.dim, fontSize: 11,
              fontWeight: tab === t.key ? 700 : 400, fontFamily: "'Outfit',sans-serif",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── CHARTS ── */}
        <div key={tab} style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
          padding: "20px 14px", animation: "slideIn 0.35s ease forwards",
        }}>

          {tab === "decompose" && (
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, margin: "0 0 4px 6px" }}>Return Anatomy</h3>
              <p style={{ fontSize: 10, color: C.dim, margin: "0 0 16px 6px" }}>Year-by-year breakdown: earnings{mode === "pffo" ? " + yield" : ""} vs {modeLabel} effect</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={annualD} margin={{ top: 8, right: 6, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
                  <XAxis dataKey="year" tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`}/>
                  <Tooltip content={<TT/>}/>
                  <Legend wrapperStyle={{ fontSize: 10 }}/>
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)"/>
                  <Bar dataKey="earnings" name="Earnings" stackId="a" fill={C.blue} radius={[0,0,0,0]}/>
                  {mode === "pffo" && <Bar dataKey="yield" name="DPU Yield" stackId="a" fill={C.cyan} radius={[0,0,0,0]}/>}
                  <Bar dataKey="pe" name={`${modeLabel} Effect`} stackId="a" radius={[3,3,0,0]}>
                    {annualD.map((d, i) => <Cell key={i} fill={d.pe >= 0 ? C.green : C.red}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Waterfall */}
              <div style={{ display: "flex", gap: 8, marginTop: 24, padding: "0 4px" }}>
                {[
                  { l: "Earnings", v: r1.fin.er, c: C.blue, i: "📈" },
                  ...(mode === "pffo" ? [{ l: "DPU Yield", v: dyield * yrs, c: C.cyan, i: "💰" }] : []),
                  { l: `${modeLabel} Effect`, v: r1.fin.per, c: r1.fin.per >= 0 ? C.green : C.red, i: r1.fin.per >= 0 ? "🔼" : "🔻" },
                  { l: "Total", v: r1.fin.tr + (mode === "pffo" ? dyield * yrs : 0), c: "#f5f5f5", i: "🎯" },
                ].map((item, i, arr) => {
                  const maxV = Math.max(...arr.map(a => Math.abs(a.v)), 1);
                  const h = Math.max(8, (Math.abs(item.v) / maxV) * 80);
                  return (
                    <div key={i} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 16, marginBottom: 4 }}>{item.i}</div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700, color: item.c, marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>
                        {item.v >= 0 ? "+" : ""}{item.v.toFixed(0)}%
                      </div>
                      <div style={{ height: h, borderRadius: 6, margin: "0 auto", width: "75%", background: `linear-gradient(180deg, ${item.c}45, ${item.c}10)`, border: `1px solid ${item.c}25` }}/>
                      <div style={{ fontSize: 8, color: C.dim, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.l}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "trajectory" && (
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, margin: "0 0 4px 6px" }}>Price Evolution</h3>
              <p style={{ fontSize: 10, color: C.dim, margin: "0 0 16px 6px" }}>Price = {mode === "pffo" ? "FFO" : "EPS"} × {modeLabel} — both forces visualized</p>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={r1.data} margin={{ top: 8, right: 36, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
                  <XAxis dataKey="year" tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false}/>
                  <YAxis yAxisId="p" tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false}/>
                  <YAxis yAxisId="pe" orientation="right" tick={{ fill: C.violet, fontSize: 10 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TT/>}/>
                  <Legend wrapperStyle={{ fontSize: 10 }}/>
                  <Area yAxisId="p" type="monotone" dataKey="price" name="Price" stroke="#f5f5f5" fill="rgba(245,245,245,0.03)" strokeWidth={2.5} dot={{ r: 4, fill: "#f5f5f5", stroke: C.bg, strokeWidth: 3 }}/>
                  <Line yAxisId="p" type="monotone" dataKey="eps" name={mode === "pffo" ? "FFO" : "EPS"} stroke={C.blue} strokeWidth={2} dot={{ r: 3, fill: C.blue, stroke: C.bg, strokeWidth: 2 }} strokeDasharray="7 3"/>
                  <Line yAxisId="pe" type="monotone" dataKey="pe" name={`${modeLabel} Multiple`} stroke={C.violet} strokeWidth={2} dot={{ r: 3, fill: C.violet, stroke: C.bg, strokeWidth: 2 }}/>
                </ComposedChart>
              </ResponsiveContainer>
              {peShape !== "linear" && (
                <div style={{ fontSize: 10, color: C.dim, textAlign: "center", marginTop: 10 }}>
                  {modeLabel} path: {peShape === "front" ? "⤴ Front-loaded — most of the re-rating happens early" : "⤵ Back-loaded — re-rating accelerates at exit"}
                </div>
              )}
            </div>
          )}

          {tab === "heatmap" && (
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, margin: "0 0 4px 6px" }}>IRR Heatmap</h3>
              <p style={{ fontSize: 10, color: C.dim, margin: "0 0 12px 6px" }}>
                Entry {modeLabel} {entryPE}× · {yrs}yr hold{mode === "pffo" ? ` · ${dyield}% DPU yield` : ""} · Total CAGR at each combo
              </p>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 600, fontSize: 10 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "6px 4px", textAlign: "left", fontSize: 8, color: C.muted, fontWeight: 700, borderBottom: `1px solid ${C.border}`, position: "sticky", left: 0, background: C.bg, zIndex: 1 }}>
                        {earningsLabel} ↓ / Exit {modeLabel} →
                      </th>
                      {heatmap.eps.map(ep => (
                        <th key={ep} style={{
                          padding: "6px 3px", textAlign: "center", fontSize: 9, fontWeight: ep === exitPE ? 800 : 500,
                          color: ep === exitPE ? accent : C.muted, borderBottom: `1px solid ${C.border}`,
                        }}>{ep}×</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmap.gs.map((g, gi) => (
                      <tr key={g}>
                        <td style={{
                          padding: "6px 4px", fontSize: 9, fontWeight: g === eg ? 800 : 500,
                          color: g === eg ? C.blue : C.muted, borderRight: `1px solid ${C.border}`,
                          position: "sticky", left: 0, background: C.bg, zIndex: 1,
                        }}>{g}%</td>
                        {heatmap.mx[gi].map((val, ei) => (
                          <HC key={ei} v={val} sel={heatmap.eps[ei] === exitPE && g === eg}/>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
                {[
                  { l: ">20%", c: "rgba(52,211,153,0.45)" },
                  { l: "15–20%", c: "rgba(52,211,153,0.25)" },
                  { l: "10–15%", c: "rgba(251,191,36,0.25)" },
                  { l: "0–10%", c: "rgba(251,146,60,0.2)" },
                  { l: "<0%", c: "rgba(248,113,113,0.3)" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8, color: C.muted }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.c }}/>{s.l}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "compare" && compare && r2 && compareChartData && (
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, margin: "0 0 4px 6px" }}>Head-to-Head</h3>
              <p style={{ fontSize: 10, color: C.dim, margin: "0 0 16px 6px" }}>{label1} vs {label2} — price trajectory over {yrs} years</p>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={compareChartData} margin={{ top: 8, right: 36, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
                  <XAxis dataKey="year" tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false}/>
                  <YAxis yAxisId="p" tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false}/>
                  <YAxis yAxisId="pe" orientation="right" tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TT/>}/>
                  <Legend wrapperStyle={{ fontSize: 10 }}/>
                  <Area yAxisId="p" type="monotone" dataKey="price1" name={`${label1} Price`} stroke={C.blue} fill={`${C.blue}08`} strokeWidth={2.5} dot={{ r: 4, fill: C.blue, stroke: C.bg, strokeWidth: 2 }}/>
                  <Area yAxisId="p" type="monotone" dataKey="price2" name={`${label2} Price`} stroke={C.violet} fill={`${C.violet}08`} strokeWidth={2.5} dot={{ r: 4, fill: C.violet, stroke: C.bg, strokeWidth: 2 }}/>
                  <Line yAxisId="pe" type="monotone" dataKey="pe1" name={`${label1} ${modeLabel}`} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
                  <Line yAxisId="pe" type="monotone" dataKey="pe2" name={`${label2} ${modeLabel}`} stroke={C.violet} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
                </ComposedChart>
              </ResponsiveContainer>

              {/* Compare table */}
              <div style={{ marginTop: 20 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: "8px 6px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: 10 }}>Metric</th>
                      <th style={{ padding: "8px 6px", textAlign: "right", color: C.blue, fontWeight: 700, fontSize: 10 }}>{label1}</th>
                      <th style={{ padding: "8px 6px", textAlign: "right", color: C.violet, fontWeight: 700, fontSize: 10 }}>{label2}</th>
                      <th style={{ padding: "8px 6px", textAlign: "right", color: C.muted, fontWeight: 600, fontSize: 10 }}>Edge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { m: "Total CAGR", a: r1.totalCAGR, b: r2.totalCAGR, fmt: v => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%` },
                      { m: "Price CAGR", a: r1.priceCAGR, b: r2.priceCAGR, fmt: v => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%` },
                      { m: `${modeLabel} Change`, a: ((exitPE - entryPE) / entryPE) * 100, b: ((exitPE2 - entryPE2) / entryPE2) * 100, fmt: v => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%` },
                      { m: earningsLabel, a: eg, b: eg2, fmt: v => `${v}%` },
                      ...(mode === "pffo" ? [{ m: "DPU Yield", a: dyield, b: dyield2, fmt: v => `${v.toFixed(1)}%` }] : []),
                      { m: "Total Return", a: r1.fin.tr, b: r2.fin.tr, fmt: v => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%` },
                    ].map((row, i) => {
                      const edge = row.a - row.b;
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                          <td style={{ padding: "7px 6px", color: C.muted, fontSize: 10 }}>{row.m}</td>
                          <td style={{ padding: "7px 6px", textAlign: "right", color: C.blue, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{row.fmt(row.a)}</td>
                          <td style={{ padding: "7px 6px", textAlign: "right", color: C.violet, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{row.fmt(row.b)}</td>
                          <td style={{ padding: "7px 6px", textAlign: "right", color: edge >= 0 ? C.green : C.red, fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 10 }}>
                            {edge >= 0 ? "+" : ""}{edge.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── INSIGHT ── */}
        <div style={{
          marginTop: 20, padding: "18px 20px", borderRadius: 14,
          background: `linear-gradient(135deg, ${accent}05, transparent)`,
          borderLeft: `3px solid ${accent}50`,
        }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontWeight: 700, color: accent, marginBottom: 4 }}>The Takeaway</div>
          <p style={{ fontSize: 12, color: "#888", lineHeight: 1.7 }}>
            {isUp
              ? `${modeLabel} expansion from ${entryPE}× to ${exitPE}× injects ${r1.fin.per.toFixed(0)}% on top of ${eg}% earnings compounding${mode === "pffo" ? ` and ${dyield}% annual DPU yield` : ""}. Total CAGR of ${r1.totalCAGR.toFixed(1)}% looks compelling — but strip out the re-rating and you'd earn ~${(eg + (mode === "pffo" ? dyield : 0)).toFixed(0)}%. Ask: is ${exitPE}× sustainable, or are you renting sentiment?`
              : isDown
                ? `${modeLabel} compression from ${entryPE}× to ${exitPE}× erases ${Math.abs(r1.fin.per).toFixed(0)}% of value. ${r1.totalCAGR >= 0 ? `At ${eg}% growth${mode === "pffo" ? ` + ${dyield}% yield` : ""}, you still realize ${r1.totalCAGR.toFixed(1)}% CAGR` : `Even ${eg}% growth can't save you — negative ${Math.abs(r1.totalCAGR).toFixed(1)}% CAGR`}. The price of overpaying: Mr. Market giveth sentiment, Mr. Market taketh.`
                : `Flat ${modeLabel} at ${entryPE}×. Your ${r1.totalCAGR.toFixed(1)}% CAGR maps to ${eg}% earnings${mode === "pffo" ? ` + ${dyield}% DPU` : ""}. This is your base case — every % of expansion is gravy, every % of compression is the tax on optimism.`
            }
          </p>
          {compare && r2 && (
            <p style={{ fontSize: 12, color: C.violet, lineHeight: 1.7, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.violet}15` }}>
              {r1.totalCAGR > r2.totalCAGR
                ? `${label1} outperforms ${label2} by ${(r1.totalCAGR - r2.totalCAGR).toFixed(1)}% CAGR. The edge comes from ${r1.fin.per > r2.fin.per ? "stronger multiple expansion" : "better earnings growth"}${mode === "pffo" && dyield > dyield2 ? " and higher DPU yield" : ""}.`
                : `${label2} wins by ${(r2.totalCAGR - r1.totalCAGR).toFixed(1)}% CAGR over ${label1}. ${r2.fin.per > r1.fin.per ? "More favorable multiple dynamics" : "Stronger earnings trajectory"} drives the gap.`
              }
            </p>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 9, color: "#2a2a2a", letterSpacing: "0.08em" }}>
          THE {mode === "pffo" ? "REIT" : "PE"} RETURN MACHINE — Built for investors who think in multiples
        </div>
      </div>
    </div>
  );
}
