import { loadFont as fredoka } from '@remotion/google-fonts/Fredoka';
import { loadFont as jetbrains } from '@remotion/google-fonts/JetBrainsMono';

export const FUN = fredoka('normal', { weights: ['500', '700'], subsets: ['latin'] }).fontFamily;
export const MONO = jetbrains('normal', { weights: ['400', '700'], subsets: ['latin'] }).fontFamily;

// punchlist's toolbar purple, ink outlines and hard shadows, candy accents
export const INK = '#18181b', PURPLE = '#7c3aed', YELLOW = '#fde047', PINK = '#f9a8d4', MINT = '#86efac', SKY = '#7dd3fc', LILAC = '#c4b5fd';
export const PALETTE = [PURPLE, YELLOW, PINK, MINT, SKY, LILAC];
export const hard = (n: number) => `${n}px ${n}px 0 ${INK}`;
