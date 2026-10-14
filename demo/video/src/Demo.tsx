// The whole video: title, the browser under a moving camera, step stickers, the agent split screen, confetti, outro.
import { AbsoluteFill, spring, useCurrentFrame } from 'remotion';
import { Browser } from './Browser';
import { bursts, camera } from './camera';
import { AGENT, FPS, OUTRO, RESULT, TITLE, ox } from './cut';
import { Background, Burst, Confetti, Outro, Sticker, Title } from './parts';
import { FUN, LILAC, MINT, PINK, SKY, YELLOW } from './style';
import { Terminal } from './Terminal';
import { ev } from './timeline';

export function Demo() {
  const f = useCurrentFrame(), t = f / FPS;
  const cam = camera(t);
  const sp = (at: number, damping = 14) => spring({ frame: f - at * FPS, fps: FPS, config: { damping, stiffness: 120 } });
  // the window flies in under the title and off for the outro
  const enter = sp(TITLE.len - 0.55, 12), leave = sp(OUTRO.start, 16);
  const win = `translateY(${(1 - enter) * 1000 + leave * 1250}px) rotate(${(1 - enter) * 9 - leave * 14}deg) scale(${0.8 + enter * 0.2})`;
  // the agent scene: the window steps aside for the terminal
  const split = sp(AGENT.start) - sp(AGENT.start + AGENT.len - 0.75);
  const side = `translate(${-440 * split}px, ${40 * split}px) scale(${1 - 0.42 * split}) rotate(${-2.5 * split}deg)`;
  const s = (raw: number) => ox(raw);

  return (
    <AbsoluteFill style={{ fontFamily: FUN, overflow: 'hidden' }}>
      <Background z={cam.z} />
      <AbsoluteFill style={{ transform: side }}>
        <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(960px, 540px) rotate(${cam.tilt}deg) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)` }}>
          <Browser transform={win} />
          {bursts.map(b => <Burst key={b.t} {...b} />)}
        </AbsoluteFill>
      </AbsoluteFill>
      <Terminal t={t - AGENT.start} enter={split} />

      <Sticker from={s(ev.pick.t) - 0.5} to={s(ev.h1.t) - 0.75} x={900} y={190} step={1} bg={YELLOW}>Turn on Annotate</Sticker>
      <Sticker from={s(ev.h1.t) - 0.6} to={s(ev.typing[0]!.t) + 0.1} x={980} y={180} rot={2} step={2} bg={PINK}>Click anything</Sticker>
      <Sticker from={s(ev.typing[0]!.t) + 0.1} to={s(ev.add[0]!.t) + 0.3} x={940} y={170} rot={-2} step={3} bg={MINT}>Say what should change</Sticker>
      <Sticker from={s(ev.cta.t) - 0.5} to={s(ev.add[1]!.t) + 0.2} x={1010} y={900} rot={3} bg={SKY}>…as many as you like ✌️</Sticker>
      <Sticker from={s(ev.drag.t) - 0.4} to={s(ev.add[2]!.t) + 0.2} x={940} y={150} rot={-3} step={4} bg={LILAC}>…or drag a box</Sticker>
      <Sticker from={s(ev.send.t) - 0.7} to={AGENT.start + 0.3} x={960} y={190} rot={2} step={5} bg={YELLOW}>Send it to your agent</Sticker>
      <Sticker from={AGENT.start + 0.8} to={AGENT.start + 3.3} x={960} y={105} rot={-2} bg={MINT} size={42}>🤖 it gets every note + the source file</Sticker>
      <Sticker from={AGENT.start + 3.3} to={AGENT.start + AGENT.len - 0.4} x={960} y={105} rot={2} bg={PINK} size={42}>✍️ …edits the code, reports back</Sticker>
      <Sticker from={s(ev.reload.t) - 1.1} to={RESULT.start + 0.1} x={900} y={420} rot={-3} step={6} bg={SKY}>Reload</Sticker>
      <Sticker from={RESULT.start + 0.25} to={OUTRO.start} x={960} y={960} rot={-4} bg={YELLOW} size={64}>✨ Fixed! ✨</Sticker>

      <Confetti from={RESULT.start} />
      <Title len={TITLE.len} />
      <Outro from={OUTRO.start + 0.25} />
    </AbsoluteFill>
  );
}
