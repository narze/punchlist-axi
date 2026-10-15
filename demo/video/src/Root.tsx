import { Composition } from 'remotion';
import { Demo } from './Demo';
import { FPS, TOTAL } from './cut';

export const Root = () => (
  <Composition id="Demo" component={Demo} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={1920} height={1080} />
);
