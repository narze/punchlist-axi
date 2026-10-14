// The edit: which stretches of raw.mp4 play, how fast, and where the frame freezes. The intro and the agent scene
// freeze the page while Claude Code plays; typing and waiting run fast.
import { END, ev } from './timeline';

export const FPS = 30;
export interface Seg { start: number; len: number; raw: number; rate: number; freeze: boolean }
export const segs: Seg[] = [];
let at = 0;
const play = (from: number, to: number, rate = 1) => { segs.push({ start: at, len: (to - from) / rate, raw: from, rate, freeze: false }); at += (to - from) / rate; };
const hold = (raw: number, len: number) => { segs.push({ start: at, len, raw, rate: 1, freeze: true }); at += len; };

// Claude Code: /punchlist, the proxy starts, the link
export const INTRO = { start: 0, len: 5.9 };
hold(0.4, INTRO.len);
// "runs along your web app", then the punch list
export const ALONG = { start: at, len: 1.7 };
hold(0.4, ALONG.len);
play(0.4, ev.pick.t - 0.9, 1.5);
play(ev.pick.t - 0.9, ev.typing[0]!.t);
play(ev.typing[0]!.t, ev.typed[0]!.t, 2.5);
play(ev.typed[0]!.t, ev.drag.t, 1.5);
play(ev.drag.t, ev.dragged.t, 1.1);
play(ev.dragged.t, ev.typing[1]!.t, 1.2);
play(ev.typing[1]!.t, ev.typed[1]!.t, 2.5);
play(ev.typed[1]!.t, ev.send.t + 0.7, 1.5);
// Claude Code gets the notes and edits the code
export const AGENT = { start: at, len: 7.6 };
hold(ev.send.t + 0.7, AGENT.len);
play(ev.done.t, ev.reload.t - 1, 2.5);
play(ev.reload.t - 1, ev.result.t + 1.2);
export const RESULT = { start: at - 1.2, len: 0 };
hold(ev.result.t + 1.2, 2.2);
RESULT.len = at - RESULT.start;
// the typo, fixed by hand in the page's editor
export const EDIT = { start: at, len: 0 };
play(ev.edit.t, ev.editPick.t - 0.6, 1.5);
play(ev.editPick.t - 0.6, ev.h1.t + 0.3, 1.2);
play(ev.h1.t + 0.3, ev.editBtn.t - 0.6, 1.6);
play(ev.editBtn.t - 0.6, ev.editor.t + 0.2);
play(ev.editor.t + 0.2, ev.word.t - 0.6, 1.3);
play(ev.word.t - 0.6, ev.editTyped.t + 0.3);
play(ev.editTyped.t + 0.3, ev.save.t + 0.9);
play(ev.save.t + 0.9, ev.close.t - 0.5, 2);
play(ev.close.t - 0.5, ev.reload2.t - 0.5, 1.5);
play(ev.reload2.t - 0.5, END);
EDIT.len = at - EDIT.start;
export const OUTRO = { start: at - 0.4, len: 4.4 };
export const TOTAL = OUTRO.start + OUTRO.len;
hold(END - 0.1, TOTAL - at); // under the outro too, while the window flies off

// output seconds at which raw second `raw` plays, or null when the cut skips it
export function o(raw: number): number | null {
  for (const s of segs) if (!s.freeze && raw >= s.raw && raw <= s.raw + s.len * s.rate) return s.start + (raw - s.raw) / s.rate;
  return null;
}
export const ox = (raw: number) => { const t = o(raw); if (t === null) throw new Error(`raw ${raw}s is cut`); return t; };
