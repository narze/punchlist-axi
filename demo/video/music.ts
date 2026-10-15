// `node music.ts [seconds]`: synthesizes the soundtrack and sound effects into ../out (no samples, nothing to license).
// music.wav: a bouncy 120 BPM groove in C (I-vi-IV-V): kick, clap, hats, bass, offbeat chord stabs, a marimba hook.
// pop.wav (clicks), whoosh.wav (transitions), chime.wav (fixed!), tick.wav (keys).
import fs from 'node:fs';
import path from 'node:path';

const RATE = 44100;
const out = path.join(import.meta.dirname, '../out');

function wav(file: string, l: Float32Array, r: Float32Array = l) {
  let peak = 0;
  for (let i = 0; i < l.length; i++) peak = Math.max(peak, Math.abs(l[i] ?? 0), Math.abs(r[i] ?? 0));
  const gain = peak > 0 ? 0.89 / peak : 1, buf = Buffer.alloc(44 + l.length * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + l.length * 4, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(l.length * 4, 40);
  for (let i = 0; i < l.length; i++) {
    buf.writeInt16LE(Math.round((l[i] ?? 0) * gain * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round((r[i] ?? 0) * gain * 32767), 46 + i * 4);
  }
  fs.writeFileSync(path.join(out, file), buf);
}

// a deterministic noise source, so every render sounds the same
let seed = 7;
const noise = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 31 - 1; };
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// adds one voice at time t (seconds): f(dt) gives the sample dt seconds after its start, pan -1..1
function add(l: Float32Array, r: Float32Array, t: number, len: number, pan: number, f: (dt: number) => number) {
  const s0 = Math.round(t * RATE), n = Math.round(len * RATE);
  for (let i = 0; i < n && s0 + i < l.length; i++) {
    const v = f(i / RATE);
    l[s0 + i] = (l[s0 + i] ?? 0) + v * (1 - pan) / 2;
    r[s0 + i] = (r[s0 + i] ?? 0) + v * (1 + pan) / 2;
  }
}

const kick = (dt: number) => Math.sin(2 * Math.PI * (45 * dt + 105 * (1 - Math.exp(-dt * 30)) / 30)) * Math.exp(-dt * 9);
const clap = (dt: number) => noise() * (Math.exp(-dt * 28) + 0.5 * Math.exp(-Math.abs(dt - 0.012) * 300)) * 0.5;
const hat = (dt: number) => { const a = noise(), b = noise(); return (a - b) * Math.exp(-dt * 90) * 0.18; };
// band-limited: a few odd harmonics instead of a hard edge, which would alias into hiss
const square = (f: number, dt: number) => [1, 3, 5, 7].reduce((s, k) => (k * f < 9000 ? s + Math.sin(2 * Math.PI * k * f * dt) / k : s), 0);
const bass = (f: number) => (dt: number) => (0.6 * Math.sin(2 * Math.PI * f * dt) + 0.25 * square(f, dt)) * Math.min(1, dt * 400) * Math.exp(-dt * 6) * 0.55;
const stab = (fs: number[]) => (dt: number) => fs.reduce((s, f) => s + square(f, dt) * 0.5 + Math.sin(2 * Math.PI * f * 2 * dt) * 0.3, 0) * Math.exp(-dt * 16) * 0.07;
const marimba = (f: number) => (dt: number) => (Math.sin(2 * Math.PI * f * dt) + 0.35 * Math.sin(2 * Math.PI * f * 4 * dt) * Math.exp(-dt * 30)) * Math.exp(-dt * 7) * 0.32;

function music(seconds: number) {
  const n = Math.ceil(seconds * RATE), l = new Float32Array(n), r = new Float32Array(n);
  const beat = 0.5, bar = beat * 4;
  // C, Am, F, G: bass root, triad
  const chords = [[48, [60, 64, 67]], [45, [57, 60, 64]], [41, [57, 60, 65]], [43, [55, 59, 62]]] as const;
  // the hook: 16th-note steps of a C major pentatonic phrase, 0 = rest, two bars long
  const hook = [72, 0, 76, 79, 0, 76, 74, 0, 72, 0, 69, 72, 0, 74, 0, 0, 72, 0, 76, 79, 0, 81, 79, 0, 76, 0, 74, 76, 0, 72, 0, 0];
  const bars = Math.ceil(seconds / bar);
  for (let b = 0; b < bars; b++) {
    const t0 = b * bar, [root, triad] = chords[b % 4] ?? chords[0];
    const drums = b >= 1, full = b >= 2;
    for (let q = 0; q < 4; q++) {
      const t = t0 + q * beat;
      if (drums) add(l, r, t, 0.5, 0, kick);
      if (drums && q % 2 === 1) add(l, r, t, 0.3, 0.1, clap);
      if (drums) add(l, r, t + beat / 2, 0.06, 0.4, hat);
      if (full) add(l, r, t + beat * 0.25, 0.05, -0.4, dt => hat(dt) * 0.5);
      // offbeat stabs, a little left
      add(l, r, t + beat / 2, 0.25, -0.3, stab(triad.map(hz)));
      // bass on 8ths with an octave bounce
      add(l, r, t, 0.24, 0, bass(hz(root)));
      if (full) add(l, r, t + beat / 2, 0.22, 0, bass(hz(root + (q % 2 ? 12 : 7))));
    }
    if (full) hook.slice((b % 2) * 16, (b % 2) * 16 + 16).forEach((m, i) => { if (m) add(l, r, t0 + i * beat / 4, 0.6, 0.35, marimba(hz(m))); });
  }
  // fade in, fade out, soft clip
  for (let i = 0; i < n; i++) {
    const t = i / RATE, g = Math.min(1, t / 0.4, (seconds - t) / 1.8);
    l[i] = Math.tanh((l[i] ?? 0) * 1.2) * Math.max(0, g);
    r[i] = Math.tanh((r[i] ?? 0) * 1.2) * Math.max(0, g);
  }
  return [l, r] as const;
}

function sfx(len: number, f: (dt: number) => number) {
  const l = new Float32Array(Math.round(len * RATE));
  for (let i = 0; i < l.length; i++) l[i] = f(i / RATE);
  return l;
}

const seconds = Number(process.argv[2] ?? 60);
const [ml, mr] = music(seconds);
wav('music.wav', ml, mr);
// a bubbly pop: an upward chirp
wav('pop.wav', sfx(0.12, dt => Math.sin(2 * Math.PI * (600 * dt + 4000 * dt * dt)) * Math.exp(-dt * 40)));
// a whoosh: noise through a low-pass whose cutoff rises and falls
let lp = 0;
wav('whoosh.wav', sfx(0.55, dt => { const p = dt / 0.55, k = 0.02 + 0.25 * Math.sin(Math.PI * p); lp += k * (noise() - lp); return lp * Math.sin(Math.PI * p) ** 2; }));
// fixed!: a quick C-E-G-C bell arpeggio
wav('chime.wav', sfx(1.4, dt => [84, 88, 91, 96].reduce((s, m, i) => {
  const d = dt - i * 0.07;
  return d < 0 ? s : s + (Math.sin(2 * Math.PI * hz(m) * d) + 0.3 * Math.sin(2 * Math.PI * hz(m) * 2.76 * d)) * Math.exp(-d * 4);
}, 0)));
// a key: a tiny filtered click
wav('tick.wav', sfx(0.03, dt => (noise() * 0.6 + Math.sin(2 * Math.PI * 2200 * dt)) * Math.exp(-dt * 260)));
console.log(`wrote music.wav (${seconds}s), pop.wav, whoosh.wav, chime.wav, tick.wav to ${path.relative(process.cwd(), out)}`);
