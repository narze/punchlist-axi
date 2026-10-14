// The agent's side while the page waits: `wait` prints the notes (taken from the real output), the agent edits
// (made-up diff lines), `done` reports back. `t` is seconds since the agent scene began.
import { interpolate } from 'remotion';
import { received } from './timeline';
import { FUN, INK, LILAC, MINT, MONO, PINK, YELLOW } from './style';

interface Line { at: number; text: string; color?: string; type?: number }
const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const base = (f: string) => f.split('/').at(-1) ?? f;

const lines: Line[] = [
  { at: 0.5, text: '$ punchlist-axi wait', type: 0.5 },
  { at: 1.25, text: `request r1 · ${received.length} notes`, color: LILAC },
  ...received.flatMap((n, i) => [
    { at: 1.5 + i * 0.3, text: `  ${i + 1} ${n.label}  “${short(n.comment, 30)}”`, color: YELLOW },
    { at: 1.6 + i * 0.3, text: `    ↳ ${n.file}`, color: '#a1a1aa' },
  ]),
  { at: 2.75, text: `● edit ${base(received[0]?.file ?? '')}`, color: '#fb923c' },
  { at: 2.95, text: '- <h1>Fresh coffe, roasted…', color: '#f87171' },
  { at: 3.05, text: '+ <h1>Fresh coffee, roasted…', color: MINT },
  { at: 3.25, text: '- .cta { background: #e7e5e4; padding: 6px 12px', color: '#f87171' },
  { at: 3.35, text: '+ .cta { background: #b45309; padding: 14px 28px', color: MINT },
  { at: 3.65, text: `● edit ${base(received[2]?.file ?? '')}`, color: '#fb923c' },
  { at: 3.85, text: '- .grid { gap: 4px }', color: '#f87171' },
  { at: 3.95, text: '+ .grid { gap: 24px }', color: MINT },
  { at: 4.45, text: '$ punchlist-axi done r1 "1: typo  2: button  3: gaps"', type: 0.7 },
  { at: 5.35, text: '✓ r1 done → the browser shows a toast', color: MINT },
];

export function Terminal({ t, enter }: { t: number; enter: number }) {
  if (enter <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: 1000, top: 195, width: 860, height: 700, transform: `translateX(${(1 - enter) * 1100}px) rotate(${(1 - enter) * 12 + 1.2}deg)`,
      background: INK, border: `5px solid ${INK}`, borderRadius: 22, boxShadow: `16px 16px 0 ${PINK}`, overflow: 'hidden' }}>
      <div style={{ height: 50, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', background: '#27272a', fontFamily: FUN, fontWeight: 700, fontSize: 21, color: '#e4e4e7' }}>
        {['#f87171', '#facc15', '#4ade80'].map(c => <span key={c} style={{ width: 16, height: 16, borderRadius: '50%', background: c }} />)}
        <span style={{ marginLeft: 14 }}>your agent · ~/roastery</span>
      </div>
      <div style={{ padding: '18px 24px', fontFamily: MONO, fontSize: 23, lineHeight: '33px', color: '#fafafa', whiteSpace: 'pre' }}>
        {lines.filter(l => t >= l.at).map((l, i) => {
          const n = l.type ? Math.round(interpolate(t, [l.at, l.at + l.type], [2, l.text.length], { extrapolateRight: 'clamp' })) : l.text.length;
          const typing = l.type !== undefined && n < l.text.length;
          return <div key={i} style={{ color: l.color ?? '#fafafa', fontWeight: l.type ? 700 : 400 }}>
            {l.text.startsWith('$') ? <><span style={{ color: MINT }}>$</span>{l.text.slice(1, n)}</> : l.text.slice(0, n)}
            {typing && <span style={{ background: '#fafafa' }}> </span>}
          </div>;
        })}
      </div>
    </div>
  );
}
