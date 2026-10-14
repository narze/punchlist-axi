// The problem, before Crab Code opens: describing a UI fix to an agent in words goes back and forth.
// Chat bubbles pop in, then shrink away for the answer: just point at it.
import { spring, useCurrentFrame } from 'remotion';
import { FPS, PROBLEM } from './cut';
import { Sticker } from './parts';
import type { Cue } from './Sounds';
import { FUN, hard, INK, MINT, PURPLE, YELLOW } from './style';

const P = PROBLEM.start, OFF = P + 3.75;
const chat = [
  { at: P + 0.45, me: true, text: 'make the button bigger' },
  { at: P + 1.05, me: false, text: 'Which button? I see 14 🤔' },
  { at: P + 1.75, me: true, text: 'the gray one, in the hero, under the title' },
  { at: P + 2.45, me: false, text: 'Which template renders that?' },
  { at: P + 3.0, me: true, text: '😩', big: true },
];

export const problemCues: Cue[] = [
  ...chat.map(c => ({ t: c.at, sound: 'pop' as const, volume: 0.45 })),
  { t: OFF, sound: 'whoosh', volume: 0.5 },
  { t: OFF + 0.5, sound: 'pop', volume: 0.45 },
];

export function Problem({ t }: { t: number }) {
  const f = useCurrentFrame();
  if (t > PROBLEM.start + PROBLEM.len + 0.2) return null;
  return (
    <>
      <Sticker from={P + 0.1} to={OFF} x={960} y={130} rot={-2} size={56} bg={YELLOW}>Ever described a UI fix to your agent?</Sticker>
      {chat.map((c, i) => {
        const pop = spring({ frame: f - c.at * FPS, fps: FPS, config: { damping: 11, stiffness: 180 } });
        // off they go, each shrinking where it stands, so none slides over another
        const off = spring({ frame: f - (OFF + i * 0.04) * FPS, fps: FPS, config: { damping: 20, stiffness: 160 } });
        if (pop <= 0.001 || off > 0.99) return null;
        return (
          <div key={i} style={{ position: 'absolute', top: 250 + i * 128, [c.me ? 'right' : 'left']: 330,
            transform: `translateY(${off * 40}px) rotate(${(c.me ? 1 : -1) * (off * 12 + (1 - pop) * 8)}deg) scale(${pop * (1 - off)})`, opacity: 1 - off,
            transformOrigin: c.me ? '100% 100%' : '0% 100%', display: 'flex', alignItems: 'center', gap: 16, flexDirection: c.me ? 'row-reverse' : 'row' }}>
            <span style={{ fontFamily: FUN, fontWeight: 700, fontSize: c.me ? 24 : 44, color: INK, opacity: c.me ? 0.7 : 1 }}>{c.me ? 'you' : '🤖'}</span>
            <div style={{ fontFamily: FUN, fontWeight: 500, fontSize: c.big ? 64 : 40, lineHeight: 1.2, padding: c.big ? '4px 26px' : '16px 30px',
              color: c.me ? '#fff' : INK, background: c.me ? PURPLE : '#fff', border: `5px solid ${INK}`, boxShadow: hard(8),
              borderRadius: c.me ? '28px 28px 6px 28px' : '28px 28px 28px 6px', whiteSpace: 'nowrap' }}>{c.text}</div>
          </div>
        );
      })}
      <Sticker from={OFF + 0.15} to={PROBLEM.start + PROBLEM.len + 0.1} x={960} y={450} rot={-3} size={96} bg={YELLOW}>Just point at it 👆</Sticker>
      <Sticker from={OFF + 0.5} to={PROBLEM.start + PROBLEM.len + 0.1} x={1010} y={620} rot={2} size={60} bg={MINT}>using ✅ Punchlist</Sticker>
    </>
  );
}
