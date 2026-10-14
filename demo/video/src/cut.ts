// The edit: which stretches of raw.mp4 play, how fast, and where the frame freezes. Typing runs fast, the agent
// scene freezes the page while the terminal plays, the fixed page holds for the camera to tour it.
import { END, ev } from './timeline';

export const FPS = 30;
export interface Seg { start: number; len: number; raw: number; rate: number; freeze: boolean }
export const segs: Seg[] = [];
let at = 0;
const play = (from: number, to: number, rate = 1) => { segs.push({ start: at, len: (to - from) / rate, raw: from, rate, freeze: false }); at += (to - from) / rate; };
const hold = (raw: number, len: number) => { segs.push({ start: at, len, raw, rate: 1, freeze: true }); at += len; };

export const TITLE = { start: 0, len: 2.6 };
hold(0.4, TITLE.len);
play(0.4, ev.pick.t - 0.9, 1.5);
play(ev.pick.t - 0.9, ev.typing[0]!.t);
play(ev.typing[0]!.t, ev.typed[0]!.t, 2.5);
play(ev.typed[0]!.t, ev.typing[1]!.t, 1.4);
play(ev.typing[1]!.t, ev.typed[1]!.t, 2.5);
play(ev.typed[1]!.t, ev.drag.t, 1.5);
play(ev.drag.t, ev.dragged.t, 1.1);
play(ev.dragged.t, ev.typing[2]!.t, 1.2);
play(ev.typing[2]!.t, ev.typed[2]!.t, 2.5);
play(ev.typed[2]!.t, ev.send.t + 0.7, 1.5);
export const AGENT = { start: at, len: 7.5 };
hold(ev.send.t + 0.7, AGENT.len);
play(ev.done.t, ev.reload.t - 1, 2.5);
play(ev.reload.t - 1, END);
export const RESULT = { start: at - (END - ev.result.t), len: END - ev.result.t + 3.4 };
export const OUTRO = { start: RESULT.start + RESULT.len - 0.6, len: 4.2 };
export const TOTAL = OUTRO.start + OUTRO.len;
hold(END - 0.1, TOTAL - at); // under the outro too, while the window flies off

// output seconds at which raw second `raw` plays, or null when the cut skips it
export function o(raw: number): number | null {
  for (const s of segs) if (!s.freeze && raw >= s.raw && raw <= s.raw + s.len * s.rate) return s.start + (raw - s.raw) / s.rate;
  return null;
}
export const ox = (raw: number) => { const t = o(raw); if (t === null) throw new Error(`raw ${raw}s is cut`); return t; };
