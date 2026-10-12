// Leaf module (no imports beyond package.json) so `--version` never loads the CLI graph.
import { version } from '../package.json'; // esbuild inlines only this field

export const VERSION = version;
