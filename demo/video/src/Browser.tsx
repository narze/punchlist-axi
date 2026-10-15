// The browser window: raw.mp4 cut into segments (sped up, frozen) under a title bar that names the proxy.
// `children` draw over the page in viewport px (1280x720), scaled with it.
import type { ReactNode } from 'react';
import { Freeze, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame } from 'remotion';
import { WIN } from './camera';
import { FPS, segs } from './cut';
import { FUN, hard, INK, MINT, PINK, PURPLE, YELLOW } from './style';

export function Browser({ transform, children }: { transform: string; children?: ReactNode }) {
  const h = WIN.w * 9 / 16;
  return (
    <div style={{ position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.bar + h, transform, transformOrigin: '50% 50%',
      background: '#fff', border: `5px solid ${INK}`, borderRadius: 22, boxShadow: hard(16), overflow: 'hidden', boxSizing: 'content-box' }}>
      <div style={{ height: WIN.bar, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', borderBottom: `4px solid ${INK}`, background: '#fff', boxSizing: 'border-box' }}>
        {[PINK, YELLOW, MINT].map(c => <span key={c} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: `3px solid ${INK}` }} />)}
        <div style={{ marginLeft: 18, flex: 1, height: 30, borderRadius: 999, background: '#f4f4f5', border: `3px solid ${INK}`, display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 16px', fontFamily: FUN, fontWeight: 500, fontSize: 19, color: INK }}>
          localhost:4000/
          <span style={{ marginLeft: 'auto', background: PURPLE, color: '#fff', borderRadius: 999, padding: '0 12px', fontWeight: 700, fontSize: 15 }}>via punchlist proxy</span>
        </div>
      </div>
      <div style={{ position: 'relative', width: WIN.w, height: h }}>
        {segs.map(s => {
          const from = Math.round(s.start * FPS), to = Math.round((s.start + s.len) * FPS);
          const video = <OffthreadVideo src={staticFile('raw.mp4')} trimBefore={Math.round(s.raw * FPS)} playbackRate={s.rate} muted style={{ width: '100%', height: '100%' }} />;
          return <Sequence key={from} from={from} durationInFrames={to - from} layout="none">
            <div style={{ position: 'absolute', inset: 0 }}>{s.freeze ? <Freeze frame={0}>{video}</Freeze> : video}</div>
          </Sequence>;
        })}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1280, height: 720, transform: `scale(${WIN.k})`, transformOrigin: '0 0' }}>{children}</div>
      </div>
    </div>
  );
}

// the page as it was before the agent's fix, in a corner while the fixed page shows
export function Before({ from, to, raw }: { from: number; to: number; raw: number }) {
  const f = useCurrentFrame();
  const s = spring({ frame: f - from * FPS, fps: FPS, config: { damping: 11, stiffness: 160 } }) * interpolate(f, [to * FPS - 6, to * FPS], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (f < from * FPS || s <= 0.001) return null;
  const w = 640;
  return (
    <div style={{ position: 'absolute', left: 40, bottom: 360, width: w, transform: `scale(${s}) rotate(-3deg)`, transformOrigin: '0% 100%' }}>
      <div style={{ width: w, height: w * 9 / 16, border: `5px solid ${INK}`, borderRadius: 16, overflow: 'hidden', boxShadow: hard(10), background: '#fff' }}>
        <Sequence from={Math.round(from * FPS)} durationInFrames={Math.round((to - from) * FPS)} layout="none">
          <Freeze frame={0}><OffthreadVideo src={staticFile('raw.mp4')} trimBefore={Math.round(raw * FPS)} muted style={{ width: '100%', height: '100%' }} /></Freeze>
        </Sequence>
      </div>
      <div style={{ position: 'absolute', left: -14, top: -26, fontFamily: FUN, fontWeight: 700, fontSize: 34, color: INK, background: PINK, border: `4px solid ${INK}`,
        borderRadius: 14, padding: '2px 16px', boxShadow: hard(5), transform: 'rotate(-4deg)' }}>before</div>
    </div>
  );
}
