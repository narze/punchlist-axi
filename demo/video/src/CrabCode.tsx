// Crab Code, a made-up agent CLI in a terminal, drawn row by row on a monospace grid (so a row's position is known, for the pointer).
// The transcript: `/punchlist` starts the proxy and shares the link (intro), then `wait` returns the notes (taken
// from the real output) and the agent edits (made-up diffs) and reports with `done` (agent scene).
import { AGENT, INTRO } from './cut';
import { link, received } from './timeline';
import { FUN, INK, MONO } from './style';

// `dot` and `elbow` draw ⏺ and ⎿ with CSS: the web font lacks them and the fallbacks are emoji or another width
interface Span { text: string; color?: string; bold?: boolean; underline?: boolean; bg?: string; dot?: boolean; elbow?: boolean }
export interface Row { at: number; until?: number; spans: Span[]; bg?: string; spinner?: string; link?: boolean; box?: 'top' | 'mid' | 'bottom' }

const ORANGE = '#d77757', GREEN = '#4eba65', DIM = '#8a8a8a', BLUE = '#7cb7ff', RED_BG = '#5a1d24', GREEN_BG = '#1b4724';
const txt = (text: string, s: Omit<Span, 'text'> = {}): Span => ({ text, ...s });
const row = (at: number, ...spans: Span[]): Row => ({ at, spans });
const said = (at: number, text: string) => row(at, txt('', { color: '#fafafa', dot: true }), txt(text));
const tool = (at: number, name: string, arg: string) => row(at, txt('', { color: GREEN, dot: true }), txt(name, { bold: true }), txt(`(${arg})`));
const result = (at: number, text: string, s: Omit<Span, 'text'> = {}) => row(at, txt('  ', { color: DIM, elbow: true }), txt(text, { color: DIM, ...s }));
const more = (at: number, text: string, s: Omit<Span, 'text'> = {}) => row(at, txt('     '), txt(text, { color: DIM, ...s }));
const diff = (at: number, line: number, sign: '+' | '-', code: string): Row =>
  ({ at, bg: sign === '+' ? GREEN_BG : RED_BG, spans: [txt(`     ${String(line).padStart(3)} ${sign} `, { color: sign === '+' ? '#7ee787' : '#ffa198' }), txt(code)] });

// the welcome box: its rows carry the border
const W = 52;
const welcome: Row[] = ['', '🦀 Welcome to Crab Code!', '', '  /help for help, /status for your current setup', '', '  cwd: /home/you/roastery', '']
  .map((s, i, all) => ({ ...row(0, txt(` ${s}`, s.startsWith('🦀') ? { bold: true } : { color: DIM })), box: i === 0 ? 'top' : i === all.length - 1 ? 'bottom' : 'mid' }));

// intro times count from the scene's start
const I = INTRO.start, A = AGENT.start;
export const PROMPT = { text: '/punchlist', from: I + 0.5, to: I + 1.25, submit: I + 1.6 };
export const LINK_AT = I + 3.5;
const waiting = (at: number, until: number): Row => ({ at, until, spans: [txt(' Waiting for your notes… ', { color: ORANGE }), txt('(esc to interrupt)', { color: DIM })], spinner: ORANGE });

export const transcript: Row[] = [
  ...welcome,
  row(0, txt('')),
  row(PROMPT.submit, txt(`> ${PROMPT.text}`, { color: DIM })),
  row(PROMPT.submit, txt('')),
  said(I + 1.95, 'Your dev server is on :5199. I’ll put punchlist in front of it, on :4000.'),
  tool(I + 2.35, 'Bash', 'npx -y punchlist-axi start --target 5199'),
  result(I + 2.75, 'proxy: started on port 4000'),
  more(I + 2.9, 'tailscale: http://devbox.tailnet.ts.net:4000'),
  said(I + 3.3, 'Open this link, press Annotate, click what should change, then Send:'),
  { ...row(LINK_AT, txt('  '), txt(link, { color: BLUE, underline: true })), link: true },
  tool(I + 3.9, 'Bash', 'npx -y punchlist-axi wait'),
  waiting(I + 4.05, A + 0.35),
  // the agent scene
  result(A + 0.35, `request r1 · ${received.length} notes`, { color: '#c4b5fd' }),
  ...received.flatMap((n, i) => [
    more(A + 0.5 + i * 0.2, `${i + 1} ${n.label}  “${n.comment}”`, { color: '#fde68a' }),
    more(A + 0.6 + i * 0.2, `  ↳ ${n.file}`),
  ]),
  tool(A + 1.3, 'Update', 'app/views/home/_hero.html.erb'),
  result(A + 1.45, 'Updated with 1 addition and 1 removal'),
  diff(A + 1.55, 5, '-', '.cta { … background: #e7e5e4; … padding: 6px 12px; …'),
  diff(A + 1.65, 5, '+', '.cta { … background: #b45309; … padding: 14px 28px; …'),
  tool(A + 2.0, 'Update', 'app/views/home/_plans.html.erb'),
  result(A + 2.15, 'Updated with 2 additions and 2 removals'),
  diff(A + 2.25, 4, '-', '.grid { … gap: 4px; }'),
  diff(A + 2.35, 4, '+', '.grid { … gap: 24px; }'),
  diff(A + 2.45, 5, '-', '.card { … border-radius: 4px; padding: 12px; }'),
  diff(A + 2.55, 5, '+', '.card { … border-radius: 16px; padding: 24px; }'),
  tool(A + 3.0, 'Bash', 'npx -y punchlist-axi done r1 "1: brand button  2: roomier cards"'),
  result(A + 3.3, 'request r1 · status: done'),
  said(A + 3.5, 'Both fixed. The page reloads itself to show them.'),
  tool(A + 3.9, 'Bash', 'npx -y punchlist-axi wait'),
  waiting(A + 4.0, Infinity),
];

export interface Box { x: number; y: number; w: number; h: number; font: number }
const geometry = (b: Box) => {
  const lh = Math.round(b.font * 1.5), bar = 46, inputH = lh * 3 + 24;
  return { lh, bar, inputH, padX: 22, padY: 14, cw: b.font * 0.6, rows: Math.floor((b.h - bar - inputH - 28) / lh) };
};
const visible = (rows: Row[], t: number) => rows.filter(r => t >= r.at && (r.until === undefined || t < r.until));

// where the link row sits at time t (stage px), for the pointer that opens it
export function linkPos(b: Box, t: number) {
  const g = geometry(b), shown = visible(transcript, t), first = Math.max(0, shown.length - g.rows);
  const i = shown.findIndex(r => r.link) - first;
  return { x: b.x + g.padX + g.cw * 16, y: b.y + g.bar + g.padY + i * g.lh + g.lh / 2 };
}

const SPIN = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢'];

export function CrabCode({ t, box, transform, shadow }: { t: number; box: Box; transform: string; shadow: string }) {
  const g = geometry(box), shown = visible(transcript, t).slice(-g.rows);
  const typed = PROMPT.text.slice(0, Math.max(0, Math.round((t - PROMPT.from) / (PROMPT.to - PROMPT.from) * PROMPT.text.length)));
  const input = t < PROMPT.submit ? typed : '';
  const suggest = t >= PROMPT.from && t < PROMPT.submit && input.startsWith('/');
  const blink = Math.floor(t * 2.2) % 2 === 0;
  return (
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, transform, transformOrigin: '50% 50%',
      background: '#141414', border: `5px solid ${INK}`, borderRadius: 22, boxShadow: shadow, overflow: 'hidden', fontFamily: MONO, fontSize: box.font, color: '#fafafa' }}>
      <div style={{ height: g.bar, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', background: '#262626', fontFamily: FUN, fontWeight: 700, fontSize: 20, color: '#d4d4d8' }}>
        {['#f87171', '#facc15', '#4ade80'].map(c => <span key={c} style={{ width: 16, height: 16, borderRadius: '50%', background: c }} />)}
        <span style={{ marginLeft: 14 }}>crab · ~/roastery</span>
      </div>
      <div style={{ padding: `${g.padY}px ${g.padX}px`, height: g.rows * g.lh + g.padY }}>
        {shown.map((r, i) => (
          <div key={i} style={{ height: g.lh, lineHeight: `${g.lh}px`, whiteSpace: 'pre', overflow: 'hidden', background: r.bg, boxSizing: 'border-box',
            ...(r.box ? { width: `${W}ch`, borderLeft: `2px solid ${ORANGE}`, borderRight: `2px solid ${ORANGE}`, borderRadius: r.box === 'top' ? '10px 10px 0 0' : r.box === 'bottom' ? '0 0 10px 10px' : 0,
              borderTop: r.box === 'top' ? `2px solid ${ORANGE}` : undefined, borderBottom: r.box === 'bottom' ? `2px solid ${ORANGE}` : undefined } : {}) }}>
            {r.spinner && <span style={{ display: 'inline-block', width: '1.4ch', textAlign: 'center', color: r.spinner }}>{SPIN[Math.floor(t * 8) % SPIN.length]}</span>}
            {r.spans.map((s, j) => s.dot
              ? <span key={j} style={{ display: 'inline-block', width: '2ch' }}><span style={{ display: 'inline-block', width: '0.6em', height: '0.6em', borderRadius: '50%', background: s.color, verticalAlign: '0.05em' }} /></span>
              : s.elbow
                ? <span key={j} style={{ display: 'inline-block', width: '5ch' }}><span style={{ display: 'inline-block', marginLeft: '2ch', width: '0.8ch', height: '0.75em', borderLeft: `2px solid ${s.color ?? DIM}`, borderBottom: `2px solid ${s.color ?? DIM}`, verticalAlign: '0.25em' }} /></span>
                : <span key={j} style={{ color: s.color, fontWeight: s.bold ? 700 : 400, textDecoration: s.underline ? 'underline' : undefined, background: s.bg }}>{s.text}</span>)}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: g.padX, right: g.padX, bottom: 14 }}>
        <div style={{ border: `2px solid ${suggest ? ORANGE : '#525252'}`, borderRadius: 10, padding: '6px 14px', lineHeight: `${g.lh}px`, whiteSpace: 'pre' }}>
          <span style={{ color: DIM }}>{'> '}</span>{input}
          <span style={{ background: blink || (t > PROMPT.from && t < PROMPT.submit) ? '#fafafa' : 'transparent' }}> </span>
          {!input && t >= PROMPT.submit && <span style={{ color: '#525252' }}>Try "fix the header"</span>}
        </div>
        <div style={{ lineHeight: `${g.lh}px`, whiteSpace: 'pre', color: DIM, paddingLeft: 14 }}>
          {suggest
            ? <><span style={{ color: '#c4b5fd', fontWeight: 700 }}>/punchlist</span>{'   Click-to-edit for any running web app'}</>
            : '? for shortcuts'}
        </div>
      </div>
    </div>
  );
}
