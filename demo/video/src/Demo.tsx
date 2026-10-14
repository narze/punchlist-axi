// The whole video: the problem, Claude Code starts punchlist, the browser under a moving camera, step stickers, Claude Code
// editing in a split screen, the typo fixed in the page's editor, confetti, outro, music and sound effects.
import type { ReactNode } from 'react';
import { AbsoluteFill, spring, useCurrentFrame } from 'remotion';
import { Browser } from './Browser';
import { bursts, camera, follow, HOME, key } from './camera';
import { ClaudeCode, LINK_AT, linkPos, PROMPT, type Box } from './ClaudeCode';
import { AGENT, ALONG, EDIT, FPS, INTRO, OUTRO, RESULT, ox } from './cut';
import { Background, Burst, Confetti, Cursor, Outro, Sticker } from './parts';
import { Problem, problemCues } from './Problem';
import { type Cue, Sounds } from './Sounds';
import { FUN, hard, LILAC, MINT, PINK, PURPLE, SKY, YELLOW } from './style';
import { ev } from './timeline';

const s = (raw: number) => ox(raw);
const CC_INTRO: Box = { x: 210, y: 110, w: 1500, h: 860, font: 25 };
const CC_AGENT: Box = { x: 1000, y: 195, w: 860, h: 700, font: 18 };

// the intro's camera on Claude Code: the prompt as it is typed, then the link before the pointer opens it
const I = INTRO.start, POINT = { from: I + 4.35, to: I + 4.95, click: I + 5.0 };
const link = linkPos(CC_INTRO, POINT.click);
const introKeys = [key(I, 1), key(I + 0.5, 1.3, { x: 960, y: 880 }, 0.6), key(PROMPT.submit + 0.05, 1, HOME, 0.5), key(LINK_AT - 0.1, 1.3, link, 0.6)];

interface Note { from: number; to: number; x: number; y: number; text: ReactNode; bg: string; rot?: number; size?: number; step?: number }
const stickers: Note[] = [
  { from: I + 0.35, to: I + 2.4, x: 960, y: 62, step: 1, bg: YELLOW, text: 'Ask your agent: /punchlist' },
  { from: I + 3.95, to: INTRO.end - 0.15, x: 960, y: 62, step: 2, bg: PINK, text: 'Open the link it shares' },
  { from: ALONG.start - 0.05, to: ALONG.start + ALONG.len + 0.25, x: 960, y: 470, rot: -3, size: 78, bg: MINT, text: 'Runs along your web app' },
  { from: ALONG.start + 0.35, to: ALONG.start + ALONG.len + 0.25, x: 960, y: 615, rot: 2, size: 40, bg: SKY, text: 'no changes to your app · any framework' },
  { from: s(ev.pick.t) - 0.5, to: s(ev.cta.t) - 0.75, x: 900, y: 190, step: 3, bg: YELLOW, text: 'Turn on Annotate' },
  { from: s(ev.cta.t) - 0.6, to: s(ev.typing[0]!.t) + 0.1, x: 980, y: 180, rot: 2, step: 4, bg: PINK, text: 'Click anything' },
  { from: s(ev.typing[0]!.t) + 0.1, to: s(ev.add[0]!.t) + 0.3, x: 940, y: 170, rot: -2, step: 5, bg: MINT, text: 'Say what should change' },
  { from: s(ev.drag.t) - 0.4, to: s(ev.add[1]!.t) + 0.2, x: 940, y: 150, rot: -3, step: 6, bg: LILAC, text: '…or drag a box' },
  { from: s(ev.send.t) - 0.7, to: AGENT.start + 0.3, x: 960, y: 190, rot: 2, step: 7, bg: YELLOW, text: 'Send it to your agent' },
  { from: AGENT.start + 0.8, to: AGENT.start + 3.3, x: 960, y: 105, rot: -2, size: 42, bg: MINT, text: '🤖 it gets every note + the source file' },
  { from: AGENT.start + 3.3, to: AGENT.start + AGENT.len - 0.4, x: 960, y: 105, rot: 2, size: 42, bg: PINK, text: '✍️ …edits the code, reports back' },
  { from: s(ev.reload.t) - 1.1, to: RESULT.start + 0.1, x: 900, y: 400, rot: -3, step: 8, bg: SKY, text: 'Reload' },
  { from: RESULT.start + 0.2, to: EDIT.start + 0.1, x: 960, y: 960, rot: -4, size: 64, bg: YELLOW, text: '✨ Fixed! ✨' },
  { from: EDIT.start + 0.1, to: s(ev.editBtn.t) + 0.2, x: 960, y: 175, rot: 3, bg: LILAC, text: 'Or fix it yourself, right in the page ✎' },
  { from: s(ev.editor.t) + 0.1, to: s(ev.word.t) - 0.4, x: 960, y: 985, rot: -2, size: 40, bg: SKY, text: 'a real code editor, on the real file' },
  { from: s(ev.editTyping.t) - 0.2, to: s(ev.save.t) - 0.1, x: 960, y: 960, rot: 2, bg: MINT, text: 'coffe → coffee' },
  { from: s(ev.save.t) - 0.15, to: s(ev.close.t) - 0.4, x: 960, y: 960, rot: -2, bg: YELLOW, text: '⌘S saves it to disk' },
  { from: s(ev.edited.t) + 0.15, to: OUTRO.start + 0.2, x: 1380, y: 985, rot: -4, size: 64, bg: PINK, text: '✨ Typo gone ✨' },
];

const ticks = (from: number, to: number, every: number, volume: number): Cue[] =>
  Array.from({ length: Math.max(0, Math.floor((to - from) / every)) }, (_, i) => ({ t: from + i * every, sound: 'tick' as const, volume }));
const cues: Cue[] = [
  ...problemCues,
  { t: I, sound: 'whoosh', volume: 0.4 },
  ...ticks(PROMPT.from, PROMPT.to, (PROMPT.to - PROMPT.from) / PROMPT.text.length, 0.35),
  { t: PROMPT.submit, sound: 'tick', volume: 0.7 },
  { t: POINT.click, sound: 'pop', volume: 0.7 },
  { t: INTRO.end - 0.65, sound: 'whoosh', volume: 0.6 },
  ...ev.typing.flatMap((n, i) => ticks(s(n.t), s(ev.typed[i]!.t), 0.07, 0.22)),
  ...ticks(s(ev.editTyping.t), s(ev.editTyped.t), 0.11, 0.35),
  ...bursts.map(b => ({ t: b.t, sound: 'pop' as const, volume: 0.7 })),
  ...stickers.map(n => ({ t: n.from, sound: 'pop' as const, volume: 0.25 })),
  { t: AGENT.start, sound: 'whoosh', volume: 0.5 },
  { t: AGENT.start + AGENT.len - 0.75, sound: 'whoosh', volume: 0.5 },
  { t: RESULT.start + 0.1, sound: 'chime', volume: 0.55 },
  { t: s(ev.edited.t) + 0.05, sound: 'chime', volume: 0.6 },
  { t: OUTRO.start, sound: 'whoosh', volume: 0.6 },
];

export function Demo() {
  const f = useCurrentFrame(), t = f / FPS;
  const cam = camera(t);
  const sp = (at: number, damping = 14) => spring({ frame: f - at * FPS, fps: FPS, config: { damping, stiffness: 120 } });
  // the window flies in as Claude Code flies off, and off again for the outro
  const enter = sp(INTRO.end - 0.55, 12), leave = sp(OUTRO.start, 16);
  const win = `translateY(${(1 - enter) * 1000 + leave * 1250}px) rotate(${(1 - enter) * 9 - leave * 14}deg) scale(${0.8 + enter * 0.2})`;
  // Claude Code in the intro: pops in, the camera follows the prompt and the link, then it flies off
  const ccIn = sp(I, 12), ccOut = sp(INTRO.end - 0.65, 16), ic = follow(introKeys, t);
  const ccIntro = `translateY(${(1 - ccIn) * 500 + ccOut * 300}px) translateX(${ccOut * 1500}px) rotate(${(1 - ccIn) * -6 + ccOut * 18}deg) scale(${0.7 + ccIn * 0.3})`;
  const p = Math.min(1, Math.max(0, (t - POINT.from) / (POINT.to - POINT.from))), e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
  const pointer = { x: 1650 + (link.x - 1650) * e, y: 1010 + (link.y - 1010) * e };
  // the agent scene: the window steps aside for Claude Code
  const split = sp(AGENT.start) - sp(AGENT.start + AGENT.len - 0.75);
  const side = `translate(${-440 * split}px, ${40 * split}px) scale(${1 - 0.42 * split}) rotate(${-2.5 * split}deg)`;

  return (
    <AbsoluteFill style={{ fontFamily: FUN, overflow: 'hidden' }}>
      <Background z={t < INTRO.end ? ic.z : cam.z} />
      <Problem t={t} />
      {t >= I - 0.05 && t < INTRO.end + 0.3 && (
        <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(960px, 540px) scale(${ic.z}) translate(${-ic.x}px, ${-ic.y}px)` }}>
          <ClaudeCode t={t} box={CC_INTRO} transform={ccIntro} shadow={hard(16).replace('#18181b', PURPLE)} />
          {t >= POINT.from && t < INTRO.end - 0.6 && <Cursor x={pointer.x} y={pointer.y} scale={t >= POINT.click && t < POINT.click + 0.12 ? 0.85 : 1} />}
          <Burst t={POINT.click} x={link.x} y={link.y} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ transform: side }}>
        <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(960px, 540px) rotate(${cam.tilt}deg) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)` }}>
          {t >= INTRO.end - 0.6 && <Browser transform={win} />}
          {bursts.map(b => <Burst key={b.t} {...b} />)}
        </AbsoluteFill>
      </AbsoluteFill>
      {split > 0.001 && <ClaudeCode t={t} box={CC_AGENT} transform={`translateX(${(1 - split) * 1100}px) rotate(${(1 - split) * 12 + 1.2}deg)`} shadow={`16px 16px 0 ${PINK}`} />}

      {stickers.map(n => <Sticker key={n.from} {...n}>{n.text}</Sticker>)}
      <Confetti from={RESULT.start} />
      <Confetti from={s(ev.edited.t)} />
      <Outro from={OUTRO.start + 0.25} />
      <Sounds cues={cues} />
    </AbsoluteFill>
  );
}
