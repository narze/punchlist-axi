// The playful layer: background, stickers, click bursts, confetti, title and outro cards.
import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FUN, hard, INK, LILAC, MINT, MONO, PALETTE, PINK, PURPLE, SKY, YELLOW } from './style';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const bouncy = { damping: 9, stiffness: 170 };

export function Background({ z }: { z: number }) {
  const f = useCurrentFrame();
  const blob = (i: number, color: string, size: number, x: number, y: number) => (
    <div key={i} style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', background: color, filter: 'blur(80px)', opacity: 0.55,
      left: x + Math.sin(f / 50 + i * 2) * 120, top: y + Math.cos(f / 60 + i) * 90 }} />
  );
  // the background moves less than the window: a little parallax
  return (
    <AbsoluteFill style={{ background: '#f5f3ff', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${1 + (z - 1) * 0.15})` }}>
        {blob(0, LILAC, 700, -150, -200)}{blob(1, PINK, 600, 1350, 600)}{blob(2, YELLOW, 500, 1200, -150)}{blob(3, SKY, 520, -100, 650)}
        <AbsoluteFill style={{ backgroundImage: `radial-gradient(${LILAC} 2.5px, transparent 2.5px)`, backgroundSize: '40px 40px', backgroundPosition: `${f * 0.6}px ${f * 0.3}px`, opacity: 0.8 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// a label that pops in with a bounce, wobbles while it stays, and shrinks away
export function Sticker({ from, to, x, y, rot = -3, bg = YELLOW, size = 46, step, children }:
  { from: number; to: number; x: number; y: number; rot?: number; bg?: string; size?: number; step?: number; children: ReactNode }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const s = spring({ frame: f - from * fps, fps, config: bouncy }) * interpolate(f, [to * fps - 7, to * fps], [1, 0], clamp);
  if (f < from * fps || s <= 0.001) return null;
  const wobble = Math.sin((f - from * fps) / 10) * 1.6;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s}) rotate(${rot + wobble}deg)`,
      display: 'flex', alignItems: 'center', gap: 18, whiteSpace: 'nowrap', fontFamily: FUN, fontWeight: 700, fontSize: size, color: INK,
      background: bg, border: `5px solid ${INK}`, borderRadius: 22, padding: '12px 30px', boxShadow: hard(8) }}>
      {step !== undefined && (
        <span style={{ display: 'grid', placeItems: 'center', width: size * 1.25, height: size * 1.25, borderRadius: '50%', background: INK, color: bg, fontSize: size * 0.8 }}>{step}</span>
      )}
      {children}
    </div>
  );
}

// rays that shoot out of a click, drawn on the stage (under the camera)
export function Burst({ t, x, y }: { t: number; x: number; y: number }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const p = (f / fps - t) / 0.45;
  if (p < 0 || p > 1) return null;
  const r0 = 22 + p * 34, r1 = r0 + 20 * (1 - p);
  return (
    <svg style={{ position: 'absolute', left: x - 80, top: y - 80, overflow: 'visible' }} width={160} height={160}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        return <line key={i} x1={80 + Math.cos(a) * r0} y1={80 + Math.sin(a) * r0} x2={80 + Math.cos(a) * r1} y2={80 + Math.sin(a) * r1}
          stroke={i % 2 ? PURPLE : '#f59e0b'} strokeWidth={6 * (1 - p) + 1} strokeLinecap="round" />;
      })}
    </svg>
  );
}

// two confetti cannons from the bottom corners
export function Confetti({ from }: { from: number }) {
  const f = useCurrentFrame(), { fps, width, height } = useVideoConfig();
  const t = f / fps - from;
  if (t < 0 || t > 3.2) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: 110 }, (_, i) => {
        const left = i % 2 === 0, r = (k: string) => random(`${k}${i}`);
        const vx = (left ? 1 : -1) * (300 + r('vx') * 900), vy = -(1300 + r('vy') * 900);
        const x = (left ? 0 : width) + vx * t, y = height + 40 + vy * t + 0.5 * 2000 * t * t;
        const spin = (r('s') - 0.5) * 1400 * t, w = 14 + r('w') * 14;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: w, height: w * (r('h') > 0.5 ? 0.45 : 1), borderRadius: r('h') > 0.8 ? '50%' : 3,
          background: PALETTE[i % PALETTE.length], border: `2px solid ${INK}`, transform: `rotate(${spin}deg)`, opacity: interpolate(t, [2.6, 3.2], [1, 0], clamp) }} />;
      })}
    </AbsoluteFill>
  );
}

// "punchlist" in bouncing candy letters
function Wordmark({ from, size }: { from: number; size: number }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  return (
    <div style={{ display: 'flex', fontFamily: FUN, fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: '-0.02em' }}>
      {[...'punchlist'].map((c, i) => {
        const s = spring({ frame: f - from * fps - i * 2, fps, config: { damping: 8, stiffness: 140 } });
        return <span key={i} style={{ display: 'inline-block', color: PALETTE[i % PALETTE.length], WebkitTextStroke: `${size / 24}px ${INK}`, paintOrder: 'stroke fill',
          textShadow: `${size / 22}px ${size / 22}px 0 ${INK}`, transform: `translateY(${(1 - s) * 320}px) rotate(${(1 - s) * (i % 2 ? 30 : -30) + Math.sin(f / 9 + i) * 3}deg)` }}>{c}</span>;
      })}
    </div>
  );
}

// the pointer from punchlist's Annotate button (Lucide mouse-pointer-click, ISC)
function Pointer({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4.1 12 6" /><path d="m5.1 8-2.9-.8" /><path d="m6 12-1.9 2" /><path d="M7.2 2.2 8 5.1" />
      <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
    </svg>
  );
}

export function Title({ len }: { len: number }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const out = interpolate(f, [(len - 0.95) * fps, (len - 0.4) * fps], [0, 1], { ...clamp, easing: p => p * p });
  if (out >= 1) return null;
  const badge = spring({ frame: f - 0.45 * fps, fps, config: bouncy });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `translateY(${-out * 900}px) rotate(${-out * 8}deg)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36, marginTop: -90 }}>
        <div style={{ width: 170, height: 170, borderRadius: '50%', background: PURPLE, border: `7px solid ${INK}`, boxShadow: hard(10), display: 'grid', placeItems: 'center',
          transform: `scale(${badge}) rotate(${(1 - badge) * -120 + Math.sin(f / 7) * 6}deg)` }}><Pointer size={100} /></div>
        <Wordmark from={0.1} size={210} />
      </div>
      <Sticker from={0.85} to={len + 1} x={960} y={720} rot={-2} bg={MINT} size={52}>click it · note it · your agent fixes it</Sticker>
    </AbsoluteFill>
  );
}

export function Outro({ from }: { from: number }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  if (f < from * fps) return null;
  const code = spring({ frame: f - (from + 0.55) * fps, fps, config: bouncy });
  return (
    <AbsoluteFill style={{ alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 210 }}><Wordmark from={from + 0.1} size={180} /></div>
      <div style={{ position: 'absolute', top: 520, transform: `scale(${code}) rotate(${(1 - code) * 10 - 1}deg)`, fontFamily: MONO, fontWeight: 700, fontSize: 50, color: '#fafafa',
        background: INK, border: `5px solid ${INK}`, borderRadius: 20, padding: '20px 36px', boxShadow: `10px 10px 0 ${PURPLE}` }}>
        <span style={{ color: MINT }}>$</span> npx skills add narze/punchlist-axi
      </div>
      <Sticker from={from + 1.0} to={from + 99} x={560} y={800} rot={-5} bg={MINT}>any agent</Sticker>
      <Sticker from={from + 1.15} to={from + 99} x={960} y={830} rot={3} bg={SKY}>any framework</Sticker>
      <Sticker from={from + 1.3} to={from + 99} x={1380} y={800} rot={-3} bg={PINK}>even on your phone</Sticker>
    </AbsoluteFill>
  );
}
