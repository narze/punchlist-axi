// The whole video: the problem, Crab Code starts punchlist, the browser under a moving camera, step stickers, Crab Code
// editing in a split screen, the typo fixed in the page's editor, confetti, outro, music and sound effects.
import type { ReactNode } from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame } from 'remotion';
import { Before, Browser } from './Browser';
import { bursts, camera, follow, HOME, key, mid, WIN } from './camera';
import { CrabCode, LINK_AT, linkPos, PROMPT, type Box } from './CrabCode';
import { AGENT, ALONG, EDIT, FPS, INTRO, OUTRO, RESULT, SAVED, ox } from './cut';
import { Background, Burst, Confetti, Cursor, Outro, Sticker } from './parts';
import { Problem, problemCues } from './Problem';
import { type Cue, Sounds } from './Sounds';
import { FUN, hard, INK, LILAC, MINT, PINK, PURPLE, SKY, YELLOW } from './style';
import { ev, type Rect } from './timeline';

const s = (raw: number) => ox(raw);
const CC_INTRO: Box = { x: 210, y: 110, w: 1500, h: 860, font: 25 };
const CC_AGENT: Box = { x: 1000, y: 195, w: 860, h: 700, font: 18 };

// the intro's camera on Crab Code: the prompt as it is typed, then the link before the pointer opens it
const I = INTRO.start, POINT = { from: I + 4.0, to: I + 4.55, click: I + 4.6 };
// the agent scene's camera: in on the notes Crab Code receives, then on its diffs, then out for the browser
const A = AGENT.start;
const agentKeys = [key(A + 0.45, 1.3, { x: 1430, y: 640 }, 0.8), key(A + 1.35, 1.3, { x: 1430, y: 720 }, 0.8), key(A + 3.9, 1, HOME, 0.7)];
const link = linkPos(CC_INTRO, POINT.click);
const introKeys = [key(I, 1), key(I + 0.5, 1.3, { x: 960, y: 880 }, 0.6), key(PROMPT.submit + 0.05, 1, HOME, 0.5), key(LINK_AT - 0.1, 1.3, link, 0.6)];

interface Note { from: number; to: number; x: number; y: number; text: ReactNode; bg: string; rot?: number; size?: number; step?: number }
const stickers: Note[] = [
  { from: I + 0.35, to: I + 2.4, x: 960, y: 62, step: 1, bg: YELLOW, text: 'Use the /punchlist skill' },
  { from: I + 3.7, to: INTRO.end - 0.15, x: 960, y: 62, step: 2, bg: PINK, text: 'Open the link it shares' },
  { from: ALONG.start - 0.05, to: ALONG.start + 1.45, x: 960, y: 58, rot: -2, size: 60, bg: MINT, text: 'Runs along your web app' },
  { from: ALONG.start + 0.3, to: ALONG.start + 1.75, x: 960, y: 1030, rot: 2, size: 34, bg: SKY, text: 'zero app changes' },
  { from: ALONG.start + 1.5, to: ALONG.start + ALONG.len + 0.2, x: 860, y: 58, rot: 2, size: 54, bg: PINK, text: '📱 On your phone too, via Tailscale' },
  { from: s(ev.pick.t) - 0.5, to: s(ev.cta.t) - 0.75, x: 960, y: 380, step: 3, bg: YELLOW, text: 'Turn on Annotate' },
  { from: s(ev.cta.t) - 0.6, to: s(ev.typing[0]!.t) + 0.1, x: 1460, y: 540, rot: 2, step: 4, bg: PINK, text: 'Click anything' },
  { from: s(ev.typing[0]!.t) + 0.1, to: s(ev.add[0]!.t) + 0.3, x: 940, y: 170, rot: -2, step: 5, bg: MINT, text: 'Say what should change' },
  { from: s(ev.drag.t) - 0.4, to: s(ev.add[1]!.t) + 0.2, x: 940, y: 960, rot: -3, step: 6, bg: LILAC, text: '…or drag a box' },
  { from: s(ev.send.t) - 0.7, to: AGENT.start + 0.3, x: 960, y: 190, rot: 2, step: 7, bg: YELLOW, text: 'Send it to your agent' },
  { from: AGENT.start + 0.5, to: AGENT.start + 2.4, x: 960, y: 1010, rot: -2, size: 42, bg: MINT, text: '🤖 it gets every note + the source file' },
  { from: AGENT.start + 2.4, to: AGENT.start + AGENT.len - 0.4, x: 960, y: 1010, rot: 2, size: 42, bg: PINK, text: '✍️ …edits the code, reports back' },
  { from: RESULT.start + 0.2, to: RESULT.start + 1.5, x: 1100, y: 1010, rot: -4, size: 56, bg: YELLOW, text: '✨ Fixed! ✨' },
  { from: EDIT.start + 0.15, to: EDIT.start + 1.35, x: 960, y: 160, rot: -3, size: 60, bg: PINK, text: 'Wait… “coffe”? 👀' },
  { from: EDIT.start + 1.35, to: s(ev.h1.t) - 0.2, x: 560, y: 80, rot: 3, bg: LILAC, text: 'Fix it yourself, right in the page ✎' },
  { from: s(ev.editor.t) + 0.1, to: s(ev.word.t) - 0.4, x: 960, y: 985, rot: -2, size: 40, bg: SKY, text: 'a real editor, real file' },
  { from: s(ev.editTyping.t) - 0.2, to: s(ev.save.t) - 0.1, x: 960, y: 960, rot: 2, bg: MINT, text: 'coffe → coffee' },
  { from: s(ev.save.t) - 0.15, to: SAVED.start + 1.0, x: 700, y: 960, rot: -2, bg: YELLOW, text: '⌘S saves it to disk' },
  { from: s(ev.edited.t) + 0.15, to: OUTRO.start + 0.2, x: 1560, y: 985, rot: -4, size: 64, bg: PINK, text: '✨ Typo gone ✨' },
];

const ticks = (from: number, to: number, every: number, volume: number): Cue[] =>
  Array.from({ length: Math.max(0, Math.floor((to - from) / every)) }, (_, i) => ({ t: from + i * every, sound: 'tick' as const, volume }));
const cues: Cue[] = [
  ...problemCues,
  { t: I, sound: 'whoosh', volume: 0.4 },
  ...ticks(PROMPT.from, PROMPT.to, (PROMPT.to - PROMPT.from) / PROMPT.text.length, 0.35),
  { t: PROMPT.submit, sound: 'tick', volume: 0.7 },
  { t: POINT.click, sound: 'pop', volume: 0.7 },
  { t: INTRO.end - 0.7, sound: 'whoosh', volume: 0.6 },
  { t: ALONG.start + 1.35, sound: 'whoosh', volume: 0.5 },
  ...ev.typing.flatMap((n, i) => ticks(s(n.t), s(ev.typed[i]!.t), 0.07, 0.22)),
  ...ticks(s(ev.editTyping.t), s(ev.editTyped.t), 0.11, 0.35),
  ...bursts.map(b => ({ t: b.t, sound: 'pop' as const, volume: 0.7 })),
  ...stickers.map(n => ({ t: n.from, sound: 'pop' as const, volume: 0.25 })),
  { t: AGENT.start, sound: 'whoosh', volume: 0.5 },
  { t: AGENT.start + AGENT.len - 0.75, sound: 'whoosh', volume: 0.5 },
  { t: RESULT.start + 0.1, sound: 'chime', volume: 0.55 },
  { t: EDIT.start + 0.2, sound: 'pop', volume: 0.5 },
  { t: SAVED.start, sound: 'whoosh', volume: 0.45 },
  { t: s(ev.edited.t) + 0.05, sound: 'chime', volume: 0.6 },
  { t: OUTRO.start, sound: 'whoosh', volume: 0.6 },
];

// a marker ring drawn around a spot on the page (viewport rect), on the stage under the camera
function Circle({ from, to, rect }: { from: number; to: number; rect: Rect }) {
  const f = useCurrentFrame(), t = f / FPS;
  if (t < from || t > to) return null;
  const c = mid(rect), w = rect.width * WIN.k + 36, h = rect.height * WIN.k + 20, p = Math.min(1, (t - from) / 0.4);
  const len = Math.PI * (w + h) / 2 * 1.1;
  return (
    <svg style={{ position: 'absolute', left: c.x - w / 2 - 10, top: c.y - h / 2 - 10, overflow: 'visible' }} width={w + 20} height={h + 20}>
      <ellipse cx={w / 2 + 10} cy={h / 2 + 10} rx={w / 2} ry={h / 2} fill="none" stroke="#ec4899" strokeWidth={6} strokeLinecap="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - p)} transform={`rotate(-4 ${w / 2 + 10} ${h / 2 + 10})`} />
    </svg>
  );
}

// the same page on a phone (capture.ts screenshots it at 390x844): slides in beside the browser, then away
function Phone({ from, to }: { from: number; to: number }) {
  const f = useCurrentFrame();
  const sp = (at: number, damping: number) => spring({ frame: f - at * FPS, fps: FPS, config: { damping, stiffness: 120 } });
  const s = sp(from, 12) - sp(to - 0.35, 16);
  if (s <= 0.001) return null;
  const w = 330;
  return (
    <div style={{ position: 'absolute', left: 1450, top: 190, width: w, padding: 12, background: INK, borderRadius: 58, boxShadow: hard(14),
      transform: `translateX(${(1 - s) * 900}px) rotate(${6 + (1 - s) * 20}deg)` }}>
      <div style={{ position: 'relative', borderRadius: 46, overflow: 'hidden', background: '#fff' }}>
        <Img src={staticFile('phone.png')} style={{ display: 'block', width: '100%' }} />
        <div style={{ position: 'absolute', top: 10, left: '50%', width: 96, height: 26, marginLeft: -48, borderRadius: 20, background: INK }} />
      </div>
    </div>
  );
}

export function Demo() {
  const f = useCurrentFrame(), t = f / FPS;
  const cam = camera(t);
  const sp = (at: number, damping = 14) => spring({ frame: f - at * FPS, fps: FPS, config: { damping, stiffness: 120 } });
  // the window flies in as Crab Code flies off, and off again for the outro
  const enter = sp(INTRO.end - 0.75, 12), leave = sp(OUTRO.start, 16);
  const win = `translateY(${(1 - enter) * 1000 + leave * 1250}px) rotate(${(1 - enter) * 9 - leave * 14}deg) scale(${0.8 + enter * 0.2})`;
  // Crab Code in the intro: pops in, the camera follows the prompt and the link, then it flies off
  const ccIn = sp(I, 12), ccOut = sp(INTRO.end - 0.6, 16), ic = follow(introKeys, t);
  const ccIntro = `translateY(${(1 - ccIn) * 500 + ccOut * 300}px) translateX(${ccOut * 1500}px) rotate(${(1 - ccIn) * -6 + ccOut * 18}deg) scale(${0.7 + ccIn * 0.3})`;
  const p = Math.min(1, Math.max(0, (t - POINT.from) / (POINT.to - POINT.from))), e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
  const pointer = { x: 1650 + (link.x - 1650) * e, y: 1010 + (link.y - 1010) * e };
  // the agent scene: the window steps aside for Crab Code
  const split = sp(AGENT.start) - sp(AGENT.start + AGENT.len - 0.75);
  const side = `translate(${-440 * split}px, ${40 * split}px) scale(${1 - 0.42 * split}) rotate(${-2.5 * split}deg)`;
  const ac = follow(agentKeys, t);
  // the fixed page steps right to make room for the "before" beside it
  const aside = sp(RESULT.start + 0.05) - sp(RESULT.start + 1.7);

  return (
    <AbsoluteFill style={{ fontFamily: FUN, overflow: 'hidden' }}>
      <Background z={t < INTRO.end ? ic.z : cam.z} />
      <Problem t={t} />
      {t >= I - 0.05 && t < INTRO.end + 0.3 && (
        <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(960px, 540px) scale(${ic.z}) translate(${-ic.x}px, ${-ic.y}px)` }}>
          <CrabCode t={t} box={CC_INTRO} transform={ccIntro} shadow={hard(16).replace('#18181b', PURPLE)} />
          {t >= POINT.from && t < INTRO.end - 0.45 && <Cursor x={pointer.x} y={pointer.y} scale={t >= POINT.click && t < POINT.click + 0.12 ? 0.85 : 1} />}
          <Burst t={POINT.click} x={link.x} y={link.y} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(960px, 540px) scale(${ac.z}) translate(${-ac.x}px, ${-ac.y}px)` }}>
      <AbsoluteFill style={{ transform: `${side} translateX(${260 * aside}px) scale(${1 - 0.3 * aside})` }}>
        <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(960px, 540px) rotate(${cam.tilt}deg) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)` }}>
          {t >= INTRO.end - 0.8 && <Browser transform={win} />}
          {bursts.map(b => <Burst key={b.t} {...b} />)}
          <Circle from={EDIT.start + 0.2} to={EDIT.start + 1.5} rect={ev.typo.rect} />
        </AbsoluteFill>
      </AbsoluteFill>
      {split > 0.001 && <CrabCode t={t} box={CC_AGENT} transform={`translateX(${(1 - split) * 1100}px) rotate(${(1 - split) * 12 + 1.2}deg)`} shadow={`16px 16px 0 ${PINK}`} />}
      </AbsoluteFill>
      <Before from={RESULT.start + 0.15} to={RESULT.start + 1.75} raw={ev.done.t - 0.3} />

      <Phone from={ALONG.start + 1.35} to={ALONG.start + ALONG.len + 0.1} />
      {stickers.map(n => <Sticker key={n.from} {...n}>{n.text}</Sticker>)}
      {/* a quick flash over the jump from the editor to the reloaded page */}
      <AbsoluteFill style={{ background: '#fff', opacity: Math.max(0, 1 - Math.abs(t - SAVED.start) / 0.12) * 0.85, pointerEvents: 'none' }} />
      <Confetti from={RESULT.start + 1.7} />
      <Confetti from={s(ev.edited.t)} />
      <Outro from={OUTRO.start + 0.25} />
      <Sounds cues={cues} />
    </AbsoluteFill>
  );
}
