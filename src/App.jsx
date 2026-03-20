import { useState, useEffect, useRef } from "react";

// ─── COLOR TOKENS ──────────────────────────────────────────────────────────
const C = {
  bg:         '#F2F6F4',
  card:       'rgba(255,255,255,0.93)',
  green:      '#00A878',     // intellectual jade green
  greenLight: '#34C99A',
  teal:       '#007A58',
  warm:       '#907163',
  warmLight:  '#0D1F17',
  text:       '#0D1F17',
  muted:      '#4A6E62',
  faint:      'rgba(0,168,120,0.07)',
  border:     'rgba(0,168,120,0.14)',
  tealGlow:   'rgba(0,168,120,0.20)',
  tealDim:    'rgba(0,168,120,0.12)',
  oldDot:     '#6A8E80',
  oldLabel:   '#4A6E62',
  blue:       '#007A58',
  blueDark:   'rgba(242,246,244,0.98)',
};

const MOBILE = 767;
const TABLET = 1023;
const FONT   = '"Titillium Web", sans-serif';

// ← Paste your Google Apps Script Web App URL here after deployment
const GSHEET_URL = 'https://script.google.com/macros/s/AKfycbx1RSb49TWSmpY6kA8ZOknflpjXHg56XE39Pq3mS8NFnoH3FpKYwHOqBiNcKiU4fCpT/exec';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease    = (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;

// ─── HOOKS ────────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
}

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold }
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return [ref, vis];
}

function Fade({ children, delay = 0, y = 24 }) {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'none' : `translateY(${y}px)`,
      transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                   transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function CTABtn({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, fontSize: 15, fontWeight: 600,
        letterSpacing: 0.6, cursor: 'pointer',
        padding: '15px 44px', borderRadius: 9,
        border: `1.5px solid ${C.green}`,
        color: hov ? C.bg : C.green,
        background: hov ? C.green : 'transparent',
        boxShadow: hov ? `0 0 50px ${C.tealGlow}, 0 0 20px ${C.tealGlow}` : 'none',
        transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}
    >{children}</button>
  );
}

function Wrap({ children, style }) {
  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto', width: '100%',
      padding: '0 clamp(16px, 4vw, 80px)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STARFIELD CANVAS
// ═══════════════════════════════════════════════════════════════════════════
function StarfieldCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId, time = 0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const NUM_STARS = 280;
    let stars = [];
    const initStars = () => {
      stars = Array.from({ length: NUM_STARS }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.0 + 0.2,
        baseOpacity:  Math.random() * 0.10 + 0.04,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOff:   Math.random() * Math.PI * 2,
      }));
    };
    initStars();

    const COMET_COLORS = [C.green, C.greenLight, '#EDF5E1'];
    let comets = [];
    let nextCometIn = 60 + Math.random() * 240;

    const spawnComet = () => {
      const W = canvas.width, H = canvas.height;
      const fromTop = Math.random() < 0.6;
      const angleDeg = 35 + Math.random() * 20;
      const angleRad = angleDeg * Math.PI / 180;
      comets.push({
        x: fromTop ? Math.random() * W : -20,
        y: fromTop ? -20 : Math.random() * H * 0.5,
        dx: Math.cos(angleRad), dy: Math.sin(angleRad),
        speed: 8 + Math.random() * 6,
        length: 120 + Math.random() * 80,
        opacity: 0, life: 0, maxLife: 120,
        color: COMET_COLORS[Math.floor(Math.random() * COMET_COLORS.length)],
      });
    };

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const shift = Math.sin(time * 0.0008) * 0.03;
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0,   `rgba(225,243,234,${0.93 + shift})`);
      bgGrad.addColorStop(0.45,`rgba(240,248,243,${0.97 - shift})`);
      bgGrad.addColorStop(1,   `rgba(228,241,236,${0.93 + shift})`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      for (const s of stars) {
        const op = s.baseOpacity + Math.sin(time * s.twinkleSpeed + s.twinkleOff) * 0.1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,100,60,${clamp01(op)})`;
        ctx.fill();
      }

      for (const c of comets) {
        let op;
        if (c.life < 20)            op = (c.life / 20) * 0.9;
        else if (c.life > c.maxLife - 20) op = ((c.maxLife - c.life) / 20) * 0.9;
        else                        op = 0.9;
        c.opacity = op;

        const tailX = c.x - c.dx * c.length, tailY = c.y - c.dy * c.length;
        const hex = c.color.replace('#','');
        const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
        const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
        grad.addColorStop(0, `rgba(${r},${g},${b},${op})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(c.x, c.y, 2, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${r},${g},${b},${op})`; ctx.fill();
        c.x += c.dx * c.speed; c.y += c.dy * c.speed; c.life++;
      }
      comets = comets.filter(c => c.life < c.maxLife);
      nextCometIn--;
      if (nextCometIn <= 0 && comets.length < 2) { spawnComet(); nextCometIn = 240 + Math.random()*300; }
      time++;
      rafId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      zIndex: 0, pointerEvents: 'none', display: 'block',
    }} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 1 — HERO
// ═══════════════════════════════════════════════════════════════════════════
function Hero({ sectionRef, onCTAClick }) {
  const [on, setOn] = useState(false);
  const width = useWindowWidth();
  const isMobile = width <= MOBILE;
  useEffect(() => { const t = setTimeout(() => setOn(true), 120); return () => clearTimeout(t); }, []);
  const tr = (d) => `opacity 1.1s ease ${d}ms, transform 1.1s cubic-bezier(0.16,1,0.3,1) ${d}ms`;

  return (
    <section ref={sectionRef} style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      padding: isMobile ? '60px 0' : '80px 0',
      textAlign: 'center',
      position: 'relative', overflow: 'hidden', background: 'transparent',
      width: '100%', boxSizing: 'border-box',
    }}>
      <Wrap style={{ position: 'relative', zIndex: 2 }}>
        <h1 style={{
          opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(30px)', transition: tr(280),
          fontFamily: FONT, fontSize: isMobile ? 'clamp(26px, 7vw, 38px)' : 'clamp(32px, 5.8vw, 82px)',
          fontWeight: 900, lineHeight: 1.08, color: C.text,
          marginBottom: isMobile ? 24 : 34, letterSpacing: '-0.02em',
        }}>
          Что если вашу диссертацию<br/>
          оценят лучшие умы в истории
          <span style={{ color: C.green }}> — уже сегодня?</span>
        </h1>

        <p style={{
          opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(20px)', transition: tr(480),
          fontFamily: FONT, fontWeight: 300, fontSize: 'clamp(16px, 1.9vw, 20px)',
          color: C.muted, lineHeight: 1.8, maxWidth: 680,
          margin: isMobile ? '0 auto 40px' : '0 auto 56px',
        }}>
          Виртуальный диссертационный совет из социальных двойников великих учёных проанализирует вашу работу и даст глубокую научную критику.
        </p>

        <div id="hero-cta" style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(14px)', transition: tr(680) }}>
          <CTABtn onClick={onCTAClick}>Начать сейчас</CTABtn>
        </div>
      </Wrap>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 2 — TIMELINE (SVG desktop / HTML mobile)
// ═══════════════════════════════════════════════════════════════════════════
const V_STEPS = ['Загрузка работы', 'Анализ', 'Дискуссия учёных', 'Критика и рекомендации'];
const H_STEPS = ['Апробация', 'Подготовка документов', 'Предварительное рассмотрение', 'Размещение материалов', 'Защита диссертации'];

function TLStep({ label, color, isLast, isTeal }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', marginBottom: isLast ? 0 : 20,
        position: 'relative', padding: '8px 10px 8px 4px', borderRadius: 8,
        background: hov ? `${color}0C` : 'transparent',
        transform: hov ? 'scale(1.04) translateX(5px)' : 'scale(1) translateX(0px)',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', cursor: 'default',
      }}
    >
      <div style={{
        position: 'absolute', left: -28, width: 14, height: 14, borderRadius: '50%',
        background: `${color}15`, border: `1px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      </div>
      <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, color: C.text, lineHeight: 1.4 }}>{label}</span>
    </div>
  );
}

function TLColumn({ type }) {
  const isTeal = type === 'new';
  const color = isTeal ? C.green : C.oldDot;
  const steps = isTeal ? V_STEPS : H_STEPS;
  const lineStyle = isTeal
    ? { background: `linear-gradient(180deg, ${C.teal}88, ${C.green})` }
    : { background: `linear-gradient(180deg, ${C.muted}55, ${C.muted}25)` };

  return (
    <div style={{ flex: 1, minWidth: 0, opacity: isTeal ? 1 : 0.75 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', padding: '5px 12px',
        background: isTeal ? `${C.green}12` : `rgba(144,113,99,0.1)`,
        border: `1px solid ${color}30`, borderRadius: 6, marginBottom: 6,
      }}>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 10, letterSpacing: 2.5, color: isTeal ? C.green : C.oldLabel, textTransform: 'uppercase' }}>
          {isTeal ? 'Виртуальный совет' : 'Текущий процесс защиты'}
        </span>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color, marginBottom: 24, paddingLeft: 2, opacity: 0.85 }}>
        {isTeal ? '✓ Рецензия за один вечер' : '⧗ Рецензия через 6 месяцев'}
      </div>
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        <div style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 2, ...lineStyle }} />
        {steps.map((label, i) => (
          <TLStep key={i} label={label} color={color} isLast={i === steps.length - 1} isTeal={isTeal} />
        ))}
      </div>
    </div>
  );
}

function TimelineMobile({ vis }) {
  return (
    <div style={{
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(24px)',
      transition: 'opacity 0.9s ease 150ms, transform 0.9s ease 150ms',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48, marginBottom: 40 }}>
        <TLColumn type="new" />
        <TLColumn type="old" />
      </div>
      <div style={{ textAlign: 'center', borderTop: `1px solid ${C.faint}`, paddingTop: 32 }}>
        <p style={{ fontFamily: FONT, fontWeight: 300, fontSize: 16, color: C.warmLight, lineHeight: 1.6, opacity: 0.9 }}>
          Старая система масштабирует <strong style={{ fontWeight: 700 }}>время</strong>.{' '}
          <span style={{ color: C.green, fontWeight: 600 }}>Новая — масштабирует <strong style={{ fontWeight: 700 }}>интеллект</strong>.</span>
        </p>
      </div>
    </div>
  );
}

// ── Desktop: SVG animated ──
const IX = 200, IY = 620, V_TOP = 40, H_END = 1064;
const V_LEN = IY - V_TOP;   // 580
const H_LEN = H_END - IX;   // 864

const V_NODES = [
  { y: 500, label: 'Загрузка работы' },
  { y: 380, label: 'Анализ' },
  { y: 260, label: 'Дискуссия учёных' },
  { y: 140, label: 'Критика и рекомендации' },
];

const H_NODES = [
  { x: 380,  l1: 'Апробация',         l2: null },
  { x: 556,  l1: 'Подготовка',        l2: 'документов' },
  { x: 732,  l1: 'Предварительное',   l2: 'рассмотрение' },
  { x: 908,  l1: 'Размещение',        l2: 'материалов' },
  { x: 1064, l1: 'Защита',            l2: 'диссертации' },
];

// Milky Way — 5 intertwined wavy thread paths near y=IY=620
const MILKY_THREADS = [
  { d: `M -500 616 C -200 613, 100 620, 300 615 C 450 611, 550 621, 700 616 C 800 612, 900 620, 1100 614 C 1250 611, 1500 618, 1800 614`, dur: '5.6s', delay: '0s',   op: 0.7 },
  { d: `M -500 618 C -200 616, 100 623, 300 618 C 450 614, 550 624, 700 619 C 800 615, 900 623, 1100 617 C 1250 613, 1500 621, 1800 616`, dur: '6.4s', delay: '0.4s',  op: 0.65 },
  { d: `M -500 621 C -200 618, 100 625, 300 620 C 450 616, 550 626, 700 621 C 800 617, 900 625, 1100 619 C 1250 615, 1500 623, 1800 618`, dur: '6.0s', delay: '0.2s',  op: 0.75 },
  { d: `M -500 624 C -200 621, 100 628, 300 623 C 450 619, 550 629, 700 624 C 800 620, 900 628, 1100 622 C 1250 618, 1500 626, 1800 621`, dur: '5.2s', delay: '0.7s',  op: 0.60 },
  { d: `M -500 627 C -200 624, 100 631, 300 626 C 450 622, 550 632, 700 627 C 800 623, 900 631, 1100 625 C 1250 621, 1500 629, 1800 624`, dur: '6.8s', delay: '0.9s',  op: 0.55 },
];

function TimelineDesktop({ vis }) {
  const [prog, setProg] = useState(0);
  const [hovVNode, setHovVNode] = useState(null);
  const [hovHNode, setHovHNode] = useState(null);
  useEffect(() => {
    if (!vis) return;
    let rafId, start = null;
    const DUR = 2000;
    const run = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / DUR, 1);
      setProg(p);
      if (p < 1) rafId = requestAnimationFrame(run);
    };
    rafId = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafId);
  }, [vis]);

  const vProg = ease(Math.min(1, prog * 1.4));
  const hProg = ease(Math.max(0, (prog - 0.28) / 0.72));
  const vPx   = vProg * V_LEN;
  const hPx   = hProg * H_LEN;

  const vClipTop = IY - vPx;
  const hClipW   = hPx;

  const vNodeOp  = (y) => clamp01((vPx - (IY - y)) / 20);
  const hNodeOp  = (x) => clamp01((hPx - (x - IX - 20)) / 20);
  const finishOp = clamp01((vPx - 480) / 30);
  const topLabelOp = clamp01((vProg - 0.88) / 0.12);
  const quoteOp  = clamp01((prog - 0.5) / 0.3);
  const endOp    = clamp01((hPx - (H_LEN - 60)) / 40);
  const nodeIntersectOp = clamp01(prog * 4);

  return (
    <div style={{ opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease', overflow: 'visible' }}>
      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          {/* Vertical line gradient (animated portion) */}
          <linearGradient id="vGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor={C.teal} />
            <stop offset="100%" stopColor={C.green} />
          </linearGradient>

          {/* Extended vertical line — fades upward above dots area */}
          <linearGradient id="vGradExt" gradientUnits="userSpaceOnUse" x1="200" y1="620" x2="200" y2="-4000">
            <stop offset="0%"    stopColor={C.teal}  stopOpacity="0.3" />
            <stop offset="12.5%" stopColor={C.green} stopOpacity="0.3" />
            <stop offset="22%"   stopColor={C.green} stopOpacity="0.12" />
            <stop offset="45%"   stopColor={C.green} stopOpacity="0" />
            <stop offset="100%"  stopColor={C.green} stopOpacity="0" />
          </linearGradient>

          {/* Milky Way horizontal gradient — fades within SVG viewport edges */}
          <linearGradient id="milkyWayGrad" gradientUnits="userSpaceOnUse" x1="0" y1="620" x2="1200" y2="620">
            <stop offset="0%"   stopColor="#4A6E62" stopOpacity="0" />
            <stop offset="6%"   stopColor="#4A6E62" stopOpacity="0.38" />
            <stop offset="50%"  stopColor="#4A6E62" stopOpacity="0.45" />
            <stop offset="94%"  stopColor="#4A6E62" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#4A6E62" stopOpacity="0" />
          </linearGradient>

          {/* Glow filters */}
          <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="softGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="7"/>
          </filter>
          <filter id="gTealSoft" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5"/>
          </filter>

          {/* Animated clip for vertical line */}
          <clipPath id="vClip">
            <rect x={IX - 18} y={vClipTop} width={36} height={IY - vClipTop} />
          </clipPath>
        </defs>

        {/* ══ EXTENDED VERTICAL LINE (static, fades above) ══ */}
        <line x1={IX} y1={-4000} x2={IX} y2={IY}
          stroke="url(#vGradExt)" strokeWidth="2" />

        {/* ══ MILKY WAY — 5 intertwined animated thread lines ══ */}
        {MILKY_THREADS.map((t, i) => (
          <path key={i} d={t.d} fill="none"
            stroke="url(#milkyWayGrad)" strokeWidth="1.1" opacity={t.op}
            style={{
              transformBox: 'fill-box', transformOrigin: 'center',
              animation: `waveThread ${t.dur} ease-in-out infinite`,
              animationDelay: t.delay,
            }}
          />
        ))}

        {/* ══ ANIMATED VERTICAL LINE (reveals from bottom to top) ══ */}
        <g clipPath="url(#vClip)">
          <line x1={IX} y1={IY} x2={IX} y2={V_TOP}
            stroke={C.green} strokeWidth="12" strokeOpacity="0.14" filter="url(#softGlow)" />
          <line x1={IX} y1={IY} x2={IX} y2={V_TOP}
            stroke="url(#vGrad)" strokeWidth="2.5" />
        </g>

        {/* ══ INTERSECTION NODE ══ */}
        <g opacity={nodeIntersectOp}>
          <circle cx={IX} cy={IY} r={9}  fill="#F2F6F4" />
          <circle cx={IX} cy={IY} r={18} fill="none" stroke={C.green} strokeOpacity="0.18" className="ring-pulse" />
          <circle cx={IX} cy={IY} r={10} fill={C.green} fillOpacity="0.12" stroke={C.green} strokeOpacity="0.5" />
          <circle cx={IX} cy={IY} r={5}  fill={C.green} filter="url(#glow)" className="dot-pulse" />
        </g>

        {/* ══ VERTICAL NODES ══ */}
        {V_NODES.map(({ y, label }, i) => {
          const isH = hovVNode === i;
          return (
            <g key={i} opacity={vNodeOp(y)}
              onMouseEnter={() => setHovVNode(i)}
              onMouseLeave={() => setHovVNode(null)}
              onClick={() => {
                const ids = ['step-01', 'step-02', 'step-03', 'step-04'];
                document.getElementById(ids[i])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={IX} cy={y} r={9} fill={C.bg} />
              <circle cx={IX} cy={y} r={13} fill="none" stroke={C.green} strokeOpacity={isH ? '0.55' : '0.28'} className="ring-pulse" />
              <circle cx={IX} cy={y} r={6} fill={C.green} filter="url(#glow)" className="dot-pulse" />
              <text x={IX + 24} y={y + 5}
                fontFamily="Titillium Web, sans-serif" fontSize="15" fill={C.text} fontWeight={isH ? '600' : '400'}>
                {label}
              </text>
            </g>
          );
        })}

        {/* ══ VERTICAL LABEL alongside vertical line ══ */}
        <g opacity={topLabelOp}>
          <text
            x={IX - 20} y={330}
            textAnchor="middle"
            fontFamily="Titillium Web, sans-serif" fontSize="9" fill={C.green}
            letterSpacing="2.5"
            transform={`rotate(-90, ${IX - 20}, 330)`}
          >
            ВИРТУАЛЬНЫЙ СОВЕТ
          </text>
        </g>

        {/* ══ FINISH BADGE ══ */}
        <g opacity={finishOp}>
          <rect x={216} y={98} width={224} height={26} rx={5}
            fill={C.green} fillOpacity="0.18" />
          <text x={226} y={116}
            fontFamily="Titillium Web, sans-serif" fontSize="13" fill={C.green} fontWeight="600">
            ✓  Рецензия за один вечер
          </text>
        </g>

        {/* ══ HORIZONTAL NODES (animated dot + static text) ══ */}
        {H_NODES.map(({ x, l1, l2 }, i) => {
          const waveDurs   = ['5.6s','6.4s','6.0s','5.2s','6.8s'];
          const waveDelays = ['0s','0.4s','0.2s','0.7s','0.9s'];
          return (
            <g key={i}
              onMouseEnter={() => setHovHNode(i)}
              onMouseLeave={() => setHovHNode(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Animated dot — rides with wave */}
              <g opacity={hNodeOp(x)}
                style={{
                  animation: `waveThread ${waveDurs[i]} ease-in-out infinite`,
                  animationDelay: waveDelays[i],
                  transformBox: 'fill-box', transformOrigin: `${x}px ${IY}px`,
                }}
              >
                <circle cx={x} cy={IY} r={7} fill={C.bg} />
                <circle cx={x} cy={IY} r={11} fill="none" stroke="#4A6E62" strokeOpacity="0.35" className="ring-pulse-slow" />
                <circle cx={x} cy={IY} r={5} fill="#4A6E62" fillOpacity="0.85" className="dot-pulse-slow" />
              </g>

              {/* Static text — never moves */}
              <g opacity={hNodeOp(x)}>
                <text x={x} y={IY + 30} textAnchor="middle"
                  fontFamily="Titillium Web, sans-serif" fontSize="12" fill="#4A6E62" opacity="0.80">
                  {l1}
                </text>
                {l2 && (
                  <text x={x} y={IY + 46} textAnchor="middle"
                    fontFamily="Titillium Web, sans-serif" fontSize="12" fill="#4A6E62" opacity="0.80">
                    {l2}
                  </text>
                )}
              </g>
            </g>
          );
        })}

        {/* ══ RIGHT END LABELS ══ */}
        <g opacity={endOp}>
          <text x={1155} y={600} textAnchor="end"
            fontFamily="Titillium Web, sans-serif" fontSize="10" fill="#4A6E62" fillOpacity="0.55" letterSpacing="1.5">
            ТЕКУЩИЙ ПРОЦЕСС ЗАЩИТЫ
          </text>
          <text x={1155} y={688} textAnchor="end"
            fontFamily="Titillium Web, sans-serif" fontSize="11" fill="#4A6E62" fillOpacity="0.55">
            Рецензия через 6 месяцев
          </text>
        </g>

        {/* ══ QUOTE ══ */}
        <g opacity={quoteOp}>
          <text x={1150} y={84} textAnchor="end"
            fontFamily="Titillium Web, sans-serif" fontSize="24" fill="#0D1F17">
            {'Старая система масштабирует '}
            <tspan fontWeight="700">{'время'}</tspan>
            {'.'}
          </text>
          <text x={1150} y={120} textAnchor="end"
            fontFamily="Titillium Web, sans-serif" fontSize="24" fill="#0D1F17">
            {'Новая — масштабирует '}
            <tspan fill={C.green} fontWeight="700">{'интеллект'}</tspan>
            {'.'}
          </text>
        </g>
      </svg>
    </div>
  );
}

function Timeline({ sectionRef }) {
  const [ref, vis] = useInView(0.05);
  const [dialogVis, setDialogVis] = useState(false);
  const width = useWindowWidth();
  const isMobile = width <= MOBILE;

  useEffect(() => {
    if (vis) {
      const t = setTimeout(() => setDialogVis(true), 1400);
      return () => clearTimeout(t);
    }
  }, [vis]);

  const setRef = (el) => {
    ref.current = el;
    if (sectionRef) sectionRef.current = el;
  };

  return (
    <section ref={setRef} style={{
      paddingTop: isMobile ? '70px' : '100px',
      paddingBottom: isMobile ? '60px' : '80px',
      background: 'transparent',
      position: 'relative', zIndex: 1, overflow: 'visible',
      width: '100%', boxSizing: 'border-box',
    }}>
      {/* Heading stays in Wrap */}
      <Wrap>
        <div style={{
          opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(24px)',
          transition: 'opacity 0.9s ease, transform 0.9s ease',
          textAlign: 'center', marginBottom: isMobile ? 40 : 48,
        }}>
          <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, letterSpacing: 3, color: C.green, textTransform: 'uppercase', marginBottom: 14 }}>
            Сравнение
          </p>
          <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: isMobile ? 'clamp(24px, 6vw, 38px)' : 'clamp(28px, 4vw, 54px)', color: C.text, lineHeight: 1.2 }}>
            Трансформация обучения
          </h2>
        </div>
      </Wrap>

      {/* SVG timeline: full section width (no Wrap) so milky threads span viewport */}
      {isMobile
        ? <Wrap><TimelineMobile vis={vis} /></Wrap>
        : <div style={{ width: '100%', overflow: 'visible' }}>
            <TimelineDesktop vis={vis} />
          </div>
      }

      {/* ── Slide-in feature card (desktop only) ── */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          left: 'clamp(54%, 58%, 64%)',
          bottom: '33%',
          zIndex: 2,
          pointerEvents: 'none',
          transform: dialogVis ? 'translateX(0)' : 'translateX(100vw)',
          transition: 'transform 0.75s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
        }}>
          {/* Card */}
          <div style={{
            background: 'rgba(255,255,255,0.97)',
            border: '1px solid rgba(74,110,98,0.20)',
            borderRadius: 14,
            padding: '18px 23px',
            width: 325,
            boxShadow: '0 4px 24px rgba(0,100,60,0.08)',
          }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: C.text }}>Диссертационный совет</span>
              <span style={{ fontFamily: FONT, fontWeight: 300, fontSize: 15, color: C.muted, lineHeight: 1.65 }}>
                {' '}— рецензирование научных текстов советом экспертов по широкому набору критериев.
              </span>
            </div>
            <div style={{ height: 1, background: 'rgba(0,168,120,0.14)', marginBottom: 14 }} />
            <p style={{
              fontFamily: FONT, fontWeight: 700, fontSize: 11,
              color: C.green, letterSpacing: '1.5px', textTransform: 'uppercase',
              marginBottom: 9,
            }}>Ключевая ценность</p>
            <p style={{ fontFamily: FONT, fontWeight: 300, fontSize: 15, color: C.text, lineHeight: 1.7 }}>
              Ускорение приращения знания, быстрые проверки гипотез, критика слабых мест, самопроверка и самоподготовка.
            </p>
          </div>
          {/* Dot — bottom-right */}
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: C.green,
            boxShadow: `0 0 14px ${C.tealGlow}, 0 0 4px ${C.green}`,
            alignSelf: 'flex-end',
            marginRight: 8,
            animation: 'starPulse 2.4s ease-in-out infinite',
          }} />
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 3 — HOW IT WORKS
// ═══════════════════════════════════════════════════════════════════════════
const STEPS = [
  { n: '01', title: 'Загружаете диссертацию', body: 'Система распознаёт структуру, гипотезу и методологию. Автоматически строится профиль работы.' },
  { n: '02', title: 'Формируется совет',       body: 'Алгоритм подбирает учёных под тему. Каждый участник — цифровой двойник реального мыслителя.' },
  { n: '03', title: 'Дискуссия',                body: 'Вы видите как участники совета спорят, обсуждают и оценивают работу между собой в реальном времени.' },
  { n: '04', title: 'Получаете результат',     body: 'Глубокая рецензия, слабые места и рекомендации — за один вечер, а не месяцы ожидания.' },
];

function StepCard({ n, title, body, isMobile, id }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      id={id}
      onMouseEnter={() => { if (!isMobile) setHov(true); }}
      onMouseLeave={() => { if (!isMobile) setHov(false); }}
      style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        padding: isMobile ? '24px 20px' : '34px 30px', borderRadius: 14,
        background: hov ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        border: `1px solid ${hov ? C.green + '55' : C.border}`,
        transform: hov ? 'translateY(-7px) scale(1.015)' : 'translateY(0px) scale(1)',
        boxShadow: hov ? `0 24px 64px rgba(0,168,120,0.12), inset 0 0 40px rgba(0,168,120,0.03)` : '0 2px 16px rgba(0,100,60,0.06)',
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)', cursor: 'default',
      }}
    >
      <div style={{
        fontFamily: FONT, fontWeight: 300, fontSize: 54, lineHeight: 1, marginBottom: 20,
        color: hov ? 'rgba(0,168,120,0.48)' : 'rgba(0,168,120,0.28)', transition: 'color 0.4s ease',
      }}>{n}</div>
      <div style={{
        width: 38, height: 2,
        background: `linear-gradient(90deg, ${C.green}, ${C.teal})`,
        marginBottom: 22,
        transform: hov ? 'scaleX(1.6)' : 'scaleX(1)',
        transformOrigin: 'left',
        transition: 'transform 0.45s cubic-bezier(0.16,1,0.3,1)',
      }} />
      <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 21, color: C.text, marginBottom: 14, lineHeight: 1.3 }}>
        {title}
      </h3>
      <p style={{ fontFamily: FONT, fontWeight: 300, fontSize: 15, color: C.muted, lineHeight: 1.8, flex: 1 }}>
        {body}
      </p>
    </div>
  );
}

function HowItWorks({ sectionRef }) {
  const width = useWindowWidth();
  const isMobile = width <= MOBILE;
  const isTablet = width > MOBILE && width <= TABLET;
  const gridCols = isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(4, 1fr)';

  return (
    <section ref={sectionRef} style={{
      padding: isMobile ? '60px 0' : '130px 0',
      background: 'transparent',
      position: 'relative', zIndex: 1,
      width: '100%', boxSizing: 'border-box',
    }}>
      <Wrap>
        <Fade>
          <div style={{ marginBottom: isMobile ? 40 : 80 }}>
            <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, letterSpacing: 3, color: C.green, textTransform: 'uppercase', marginBottom: 16 }}>
              Процесс
            </p>
            <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 'clamp(30px, 4vw, 56px)', color: C.text, lineHeight: 1.2 }}>
              Как это работает
            </h2>
          </div>
        </Fade>
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 22, alignItems: 'stretch' }}>
          {STEPS.map((s, i) => (
            <Fade key={i} delay={i * 100}>
              <StepCard {...s} isMobile={isMobile} id={`step-${s.n}`} />
            </Fade>
          ))}
        </div>
      </Wrap>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 4 — DISCUSSION DEMO
// ═══════════════════════════════════════════════════════════════════════════
const DISC = [
  { round: 'Раунд I',  name: 'Пьер Бурдьё',   abbr: 'ПБ', color: '#00A878',
    text: 'Вы поставили под сомнение процедуру включённого наблюдения — и я готов это поддержать. Однако более фундаментальна иная проблема: весь методологический замысел воспроизводит отношение господства внутри исследовательской ситуации. Результаты наблюдения не могут считаться данными о «социальных фактах» в дюркгеймовском смысле — они суть артефакт управленческого взгляда.' },
  { round: 'Раунд I',  name: 'Майкл Буравой',  abbr: 'МБ', color: '#007A58',
    text: 'Соглашусь с интерпретацией, однако рискну возразить в части категоричности. Позиция исследователя в поле является аналитическим ресурсом, а не только источником смещения — при условии, что она отрефлексирована и тематизирована. Проблема диссертации не в том, что начальник отдела вёл наблюдение, а в том, что это не обсуждается как методологическая проблема ни единым словом.' },
  { round: 'Раунд II', name: 'Пьер Бурдьё',   abbr: 'ПБ', color: '#00A878',
    text: 'Дискуссия укрепила мою позицию. Остаточное противоречие я формулирую следующим образом: диссертация использует понятие «социальное пространство» как организующую метафору, однако не имеет теоретически последовательного ответа — кто воспроизводит это пространство, при каких диспозициях агентов и с использованием какого типа капитала.' },
  { round: 'Раунд II', name: 'Майкл Буравой',  abbr: 'МБ', color: '#007A58',
    text: 'Обмен с Бурдьё заставил меня уточнить: критика методологии наблюдения не снимает позитивной ценности сравнительного дизайна. Неразрешённое противоречие: метод и вывод не масштабируются — нельзя обобщить от двух компаний к «стратегиям российских работодателей» в целом.' },
];

function DiscCard({ item, isMobile }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => { if (!isMobile) setHov(true); }}
      onMouseLeave={() => { if (!isMobile) setHov(false); }}
      style={{
        width: '100%', display: 'flex', gap: isMobile ? 16 : 24, alignItems: 'flex-start',
        padding: isMobile ? '18px 16px' : '26px 30px', borderRadius: 14,
        background: hov ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        border: `1px solid ${hov ? item.color + '55' : C.border}`,
        transform: hov ? 'translateX(12px)' : 'translateX(0px)',
        boxShadow: hov ? `0 6px 50px ${item.color}18, inset 0 0 30px ${item.color}06` : 'none',
        transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div style={{
        width: isMobile ? 36 : 48, height: isMobile ? 36 : 48,
        borderRadius: '50%', flexShrink: 0,
        background: `radial-gradient(circle, ${item.color}28, ${item.color}06)`,
        border: `1.5px solid ${item.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hov ? `0 0 24px ${item.color}35` : 'none',
        transition: 'box-shadow 0.35s ease',
      }}>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: isMobile ? 11 : 13, color: item.color }}>
          {item.abbr}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: item.color, letterSpacing: 0.6 }}>
            {item.name}
          </span>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: C.muted, padding: '2px 9px', background: C.faint, borderRadius: 5 }}>
            {item.round}
          </span>
        </div>
        <p style={{ fontFamily: FONT, fontWeight: 300, fontSize: isMobile ? 14 : 15, color: C.text, lineHeight: 1.82 }}>
          {item.text}
        </p>
      </div>
    </div>
  );
}

function Discussion({ sectionRef }) {
  const width = useWindowWidth();
  const isMobile = width <= MOBILE;

  return (
    <section ref={sectionRef} style={{
      padding: isMobile ? '70px 0' : '130px 0',
      background: 'transparent',
      position: 'relative', zIndex: 1,
      width: '100%', boxSizing: 'border-box',
    }}>
      <Wrap>
        <Fade>
          <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, letterSpacing: 3, color: C.green, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>
            Демонстрация
          </p>
          <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 54px)', color: C.text, lineHeight: 1.2, marginBottom: 16, textAlign: 'center' }}>
            Как выглядит научная критика 
          </h2>
          <p style={{ fontFamily: FONT, fontWeight: 300, fontSize: isMobile ? 14 : 16, color: C.muted, maxWidth: 560, lineHeight: 1.78, textAlign: 'center', margin: `0 auto ${isMobile ? 40 : 72}px` }}>
            Реальный фрагмент дискуссии виртуального совета — диссертация по социологии труда
          </p>
        </Fade>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {DISC.map((item, i) => (
            <Fade key={i} delay={i * 85}>
              <DiscCard item={item} isMobile={isMobile} />
            </Fade>
          ))}
        </div>
      </Wrap>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 5 — FINAL
// ═══════════════════════════════════════════════════════════════════════════
function Final({ sectionRef }) {
  const width = useWindowWidth();
  const isMobile = width <= MOBILE;

  return (
    <section ref={sectionRef} style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      padding: isMobile ? '80px 0' : '130px 0',
      textAlign: 'center',
      position: 'relative', overflow: 'hidden',
      background: 'transparent', zIndex: 1,
      width: '100%', boxSizing: 'border-box',
    }}>

      <Wrap style={{ position: 'relative', zIndex: 1, maxWidth: 840 }}>
        <Fade y={44}>
          <h2 style={{
            fontFamily: FONT, fontWeight: 900,
            fontSize: isMobile ? 'clamp(24px, 6vw, 48px)' : 'clamp(30px, 5.2vw, 72px)',
            color: C.text, lineHeight: 1.12,
            marginBottom: 40, letterSpacing: '-0.02em',
          }}>
            Академическая экспертиза<br/>больше не ограничена временем.
          </h2>
        </Fade>
        <Fade delay={180}>
          <p style={{ fontFamily: FONT, fontWeight: 300, fontSize: isMobile ? 15 : 18, color: C.muted, maxWidth: 460, margin: '0 auto 56px', lineHeight: 1.8 }}>
            Присоединяйтесь к будущему научного рецензирования.
          </p>
        </Fade>
        <Fade delay={360}>
          <CTABtn onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Запросить рецензию</CTABtn>
        </Fade>
      </Wrap>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS NAV
// ═══════════════════════════════════════════════════════════════════════════
const NAV_LABELS = ['Главный вопрос', 'Сравнение', 'Как работает', 'Дискуссия', 'Финал'];

function ProgressNav({ sectionRefs, activeSection }) {
  const width = useWindowWidth();
  const [hovIdx, setHovIdx] = useState(null);

  if (width <= MOBILE) return null;

  return (
    <div style={{
      position: 'fixed', right: 20, top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 100,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 16,
    }}>
      {NAV_LABELS.map((label, i) => {
        const isActive = activeSection === i;
        const isHov    = hovIdx === i;
        return (
          <div
            key={i}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onMouseEnter={() => setHovIdx(i)}
            onMouseLeave={() => setHovIdx(null)}
            onClick={() => sectionRefs[i]?.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            {isHov && (
              <div style={{
                position: 'absolute', right: 22, top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(242,246,244,0.97)',
                border: `1px solid ${C.border}`,
                boxShadow: '0 2px 12px rgba(0,100,60,0.10)',
                borderRadius: 8, padding: '5px 12px',
                fontSize: 11, fontFamily: FONT, fontWeight: 400,
                color: C.text, letterSpacing: 0.5,
                whiteSpace: 'nowrap', pointerEvents: 'none',
              }}>
                {label}
              </div>
            )}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{
                width:  isActive ? 12 : 10,
                height: isActive ? 12 : 10,
                borderRadius: '50%',
                background:  isActive ? C.green : 'rgba(0,168,120,0.10)',
                border:      isActive
                  ? `2px solid ${C.green}`
                  : isHov ? `1.5px solid ${C.green}` : `1.5px solid rgba(0,168,120,0.40)`,
                boxShadow: isActive ? `0 0 10px ${C.tealGlow}, 0 0 4px ${C.green}` : 'none',
                transform:   isHov && !isActive ? 'scale(1.2)' : 'scale(1)',
                transition:  'all 0.25s ease',
              }} />
              {isActive && (
                <div style={{
                  position: 'absolute', left: '100%', marginLeft: 4,
                  width: 6, height: 1, background: C.green,
                }} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL — email capture
// ═══════════════════════════════════════════════════════════════════════════
function Modal({ onClose }) {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const width    = useWindowWidth();
  const isMobile = width <= MOBILE;

  const submit = async () => {
    if (!email || !email.includes('@')) return;
    setLoading(true);
    if (GSHEET_URL) {
      try {
        await fetch(`${GSHEET_URL}?email=${encodeURIComponent(email)}`, { mode: 'no-cors' });
      } catch {}
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(13,31,23,0.55)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.98)',
          borderRadius: 18,
          padding: isMobile ? '36px 24px 32px' : '48px 52px 44px',
          maxWidth: 480, width: '100%',
          boxShadow: '0 24px 80px rgba(0,100,60,0.18)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, left: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: FONT, fontSize: 22, color: C.muted,
            lineHeight: 1, padding: '4px 8px',
          }}
        >×</button>

        {sent ? (
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <p style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: C.green, marginBottom: 12 }}>
              Спасибо!
            </p>
            <p style={{ fontFamily: FONT, fontWeight: 300, fontSize: 16, color: C.muted, lineHeight: 1.7 }}>
              Мы сообщим вам, когда продукт будет готов.
            </p>
          </div>
        ) : (
          <>
            <p style={{
              fontFamily: FONT, fontWeight: 300, fontSize: isMobile ? 15 : 16,
              color: C.muted, lineHeight: 1.75, marginBottom: 28, textAlign: 'justify',
            }}>
              Наша команда усердно работает, чтобы быстрее закончить и предоставить вам удобный сервис. Оставьте адрес электронной почты, чтобы мы могли сообщить вам когда вы сможете воспользоваться продуктом.
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              style={{
                width: '100%', padding: '13px 16px',
                fontFamily: FONT, fontSize: 15, color: C.text,
                background: C.bg,
                border: `1.5px solid ${C.border}`,
                borderRadius: 9, marginBottom: 16,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <CTABtn onClick={submit}>
              {loading ? 'Отправка...' : 'Отправить'}
            </CTABtn>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const heroRef     = useRef(null);
  const timelineRef = useRef(null);
  const howRef      = useRef(null);
  const discRef     = useRef(null);
  const finalRef    = useRef(null);
  const sectionRefs = [heroRef, timelineRef, howRef, discRef, finalRef];

  const [activeSection, setActiveSection] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    const observers = sectionRefs.map((ref, i) => {
      const o = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActiveSection(i); },
        { threshold: 0.4 }
      );
      if (ref.current) o.observe(ref.current);
      return o;
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <div style={{
      width: '100%', maxWidth: '100%', minHeight: '100vh',
      background: C.bg, overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300;400;600;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #E1F3EA; width: 100%; overflow-x: hidden; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track  { background: #E8EFEC; }
        ::-webkit-scrollbar-thumb  { background: #B0CEC5; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #00A878; }

        @keyframes waveThread {
          0%   { transform: translateY(0px); }
          25%  { transform: translateY(2.5px); }
          75%  { transform: translateY(-2.5px); }
          100% { transform: translateY(0px); }
        }
        @keyframes starPulse {
          0%, 100% { opacity: 0.65; box-shadow: 0 0 10px rgba(0,168,120,0.35); }
          50%       { opacity: 1;    box-shadow: 0 0 20px rgba(0,168,120,0.75); }
        }

        /* ── SVG dot animations ── */
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.65); opacity: 0.55; }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50%       { transform: scale(1.35); opacity: 0.55; }
        }
        .dot-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: dotPulse 2.4s ease-in-out infinite;
        }
        .dot-pulse-slow {
          transform-box: fill-box;
          transform-origin: center;
          animation: dotPulse 3.2s ease-in-out infinite;
        }
        .ring-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: ringPulse 2.4s ease-in-out infinite;
        }
        .ring-pulse-slow {
          transform-box: fill-box;
          transform-origin: center;
          animation: ringPulse 3.2s ease-in-out infinite;
        }
      `}</style>

      <StarfieldCanvas />
      <Hero       sectionRef={heroRef} onCTAClick={() => setModalOpen(true)} />
      <Timeline   sectionRef={timelineRef} />
      <HowItWorks sectionRef={howRef} />
      <Discussion sectionRef={discRef} />
      <Final      sectionRef={finalRef} />
      <ProgressNav sectionRefs={sectionRefs} activeSection={activeSection} />
      {modalOpen && <Modal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
