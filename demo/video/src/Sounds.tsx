// The soundtrack (music.ts synthesizes it into demo/out) and the effects, placed at output seconds.
import { Audio, interpolate, Sequence, staticFile } from 'remotion';
import { FPS, TOTAL } from './cut';

export interface Cue { t: number; sound: 'pop' | 'whoosh' | 'chime' | 'tick'; volume?: number }

export function Sounds({ cues }: { cues: Cue[] }) {
  const end = Math.round(TOTAL * FPS);
  return (
    <>
      <Audio src={staticFile('music.wav')} volume={f => 0.42 * interpolate(f, [0, 8, end - 50, end], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
      {cues.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.t * FPS))} durationInFrames={Math.round(1.5 * FPS)} layout="none">
          <Audio src={staticFile(`${c.sound}.wav`)} volume={c.volume ?? 0.6} />
        </Sequence>
      ))}
    </>
  );
}
