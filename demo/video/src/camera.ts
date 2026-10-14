// Where the camera looks: keyframes in output seconds, each a zoom and a point on the stage (1920x1080).
// The camera eases from wherever it is to a key over `d` seconds from the key's time; every click punches in a little.
import { AGENT, OUTRO, RESULT, o, ox } from './cut';
import { ev, type Rect } from './timeline';

// the browser window on the stage: the 1280x720 viewport drawn at 1440x810 under a 48px title bar
export const WIN = { x: 240, y: 111, w: 1440, bar: 48, k: 1440 / 1280 };
export const toStage = (x: number, y: number) => ({ x: WIN.x + x * WIN.k, y: WIN.y + WIN.bar + y * WIN.k });
const mid = (r: Rect) => toStage(r.x + r.width / 2, r.y + r.height / 2);

interface Key { t: number; z: number; x: number; y: number; d: number }
const HOME = { z: 1, x: 960, y: 540 };
const key = (t: number, z: number, p: { x: number; y: number } = HOME, d = 0.7): Key => ({ t, z, ...p, d });

const keys: Key[] = [
  key(0, 1),
  key(ox(ev.pick.t) - 0.8, 2.1, mid(ev.pick.rect)),
  key(ox(ev.h1.t) - 0.7, 1.7, mid(ev.h1.rect)),
  key(ox(ev.typing[0]!.t) - 0.15, 1.9, mid(ev.typing[0]!.rect)),
  key(ox(ev.add[0]!.t) + 0.1, 1.15, HOME, 0.5),
  key(ox(ev.cta.t) - 0.7, 2.4, mid(ev.cta.rect)),
  key(ox(ev.typing[1]!.t) - 0.15, 1.9, mid(ev.typing[1]!.rect)),
  key(ox(ev.add[1]!.t) + 0.1, 1, HOME, 0.5),
  key(ox(ev.drag.t) - 0.3, 1.3, mid(ev.drag.rect)),
  key(ox(ev.typing[2]!.t) - 0.15, 1.9, mid(ev.typing[2]!.rect)),
  key(ox(ev.add[2]!.t) + 0.1, 1, HOME, 0.5),
  key(ox(ev.send.t) - 0.8, 2.5, mid(ev.send.rect)),
  key(AGENT.start, 1, HOME, 0.5),
  key(ox(ev.reload.t) - 1.3, 2.1, mid(ev.reload.rect)),
  key(RESULT.start + 0.2, 1.7, mid(ev.h1.rect), 0.8),
  // the fixed button is bigger than the old one
  key(RESULT.start + 1.4, 2, mid({ ...ev.cta.rect, width: ev.cta.rect.width + 30, height: ev.cta.rect.height + 20 }), 0.8),
  key(RESULT.start + 2.6, 1.25, mid(ev.drag.rect), 0.8),
  key(OUTRO.start - 0.2, 1, HOME, 0.6),
];

const ease = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const clamp = (p: number) => Math.min(1, Math.max(0, p));

// a quick zoom-in that settles, at each click the cut keeps
export const bursts = [ev.pick, ev.h1, ev.cta, ...ev.add, ev.send, ev.reload].flatMap(c => {
  const t = o(c.t);
  return t === null ? [] : [{ t, ...mid(c.rect) }];
});
const punch = (t: number) => bursts.reduce((s, b) => (t >= b.t && t < b.t + 0.6 ? s + 0.05 * Math.exp(-(t - b.t) * 7) * Math.sin((t - b.t) * 18) : s), 0);

export function camera(t: number) {
  let cur = { ...HOME };
  for (const k of keys) {
    if (t < k.t) break;
    const p = ease(clamp((t - k.t) / k.d));
    cur = { z: cur.z + (k.z - cur.z) * p, x: cur.x + (k.x - cur.x) * p, y: cur.y + (k.y - cur.y) * p };
  }
  // a little hand-held sway while zoomed in
  const tilt = 0.5 * Math.sin(t * 1.1) * Math.min(1, (cur.z - 1) / 1.2);
  return { ...cur, z: cur.z * (1 + punch(t)), tilt };
}
