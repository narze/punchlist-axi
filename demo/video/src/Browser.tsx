// The browser window: raw.mp4 cut into segments (sped up, frozen) under a title bar that names the proxy.
import { Freeze, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { WIN } from './camera';
import { FPS, segs } from './cut';
import { FUN, hard, INK, MINT, PINK, PURPLE, YELLOW } from './style';

export function Browser({ transform }: { transform: string }) {
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
      </div>
    </div>
  );
}
