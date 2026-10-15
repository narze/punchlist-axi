// `pnpm render` / `pnpm studio` read raw.mp4 and timeline.json from demo/out (run `pnpm demo:capture` in the repo root first).
// The system Chromium renders (no chrome-headless-shell download); $CHROME overrides it.
import { Config } from '@remotion/cli/config';

Config.setPublicDir('../out');
Config.setBrowserExecutable(process.env['CHROME'] ?? '/usr/bin/chromium');
Config.setChromeMode('chrome-for-testing');
Config.setVideoImageFormat('jpeg');
Config.setCrf(18);
