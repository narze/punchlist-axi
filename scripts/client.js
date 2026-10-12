// punchlist picker — injected by the proxy into every HTML page.
// Notes are snapshotted when added (so they survive navigation) and sent to the agent as one batch.
(() => {
  if (window.__pointEdit) return;
  window.__pointEdit = true;

  const API = '/__pe';
  const STORE = '__pe_notes';
  const MAX_ELS = 6;
  const STYLE_PROPS = ['display', 'position', 'width', 'height', 'margin', 'padding', 'gap', 'flex-direction',
    'justify-content', 'align-items', 'color', 'background-color', 'font-family', 'font-size', 'font-weight',
    'line-height', 'border', 'border-radius', 'box-shadow', 'opacity'];

  // ---------------------------------------------------------------- UI (shadow DOM, outside <body> so Turbo keeps it)
  const host = document.createElement('punchlist-root');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
  <style>
    :host { all: initial; }
    * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
    .layer { position: fixed; inset: 0; pointer-events: none; z-index: 2147483645; }
    .box { position: fixed; border: 2px solid #7c3aed; background: rgba(124,58,237,.12); border-radius: 2px; display: none; }
    .box.draft { border-color: #f59e0b; background: rgba(245,158,11,.14); display: block; }
    .box.noted { border: 1.5px dashed #7c3aed; background: transparent; display: block; }
    .box.marquee { border-style: dashed; background: rgba(124,58,237,.08); }
    .tag { position: absolute; left: -2px; top: -22px; background: #7c3aed; color: #fff; font: 11px/20px ui-monospace, monospace;
      padding: 0 6px; border-radius: 3px; white-space: nowrap; max-width: 80vw; overflow: hidden; text-overflow: ellipsis; }
    .draft .tag { background: #f59e0b; color: #000; }
    .flip .tag { top: auto; bottom: -22px; }
    .pin { position: fixed; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%; background: #7c3aed; color: #fff;
      font: 600 12px/22px ui-sans-serif, system-ui, sans-serif; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.3); }
    .tools { position: fixed; z-index: 2147483647; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); display: flex; gap: 2px;
      padding: 4px; border-radius: 999px; background: #18181b; box-shadow: 0 4px 16px rgba(0,0,0,.3); }
    .tools button { height: 40px; min-width: 40px; border: 0; border-radius: 999px; background: transparent; color: #fafafa;
      font: 600 15px ui-sans-serif, system-ui, sans-serif; cursor: pointer; padding: 0 10px; display: inline-flex; align-items: center; gap: 4px; }
    .tools button[aria-pressed="true"] { background: #7c3aed; }
    .tools .freeze[aria-pressed="true"] { background: #f59e0b; color: #000; }
    .tools .count { font-size: 12px; background: #27272a; border-radius: 999px; padding: 1px 6px; }
    .tools .busy { font-size: 12px; background: #f59e0b; color: #000; border-radius: 999px; padding: 1px 6px; display: none; }
    .tools .go { background: #7c3aed; padding: 0 14px; }
    .tools .go:disabled { background: #27272a; color: #71717a; cursor: default; }
    .sheet { position: fixed; z-index: 2147483647; left: 50%; transform: translateX(-50%); bottom: calc(68px + env(safe-area-inset-bottom, 0px));
      width: min(520px, calc(100vw - 24px)); max-height: calc(100vh - 120px); overflow: auto; background: #18181b; color: #fafafa;
      border-radius: 12px; padding: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.4); display: none; }
    .panel.top { top: calc(12px + env(safe-area-inset-top, 0px)); bottom: auto; }
    .label { font: 12px ui-monospace, monospace; color: #fbbf24; word-break: break-all; }
    .hint { font: 11px ui-monospace, monospace; color: #a1a1aa; margin-top: 2px; word-break: break-all; }
    .where { display: flex; gap: 8px; align-items: center; } .where .hint { flex: 1; min-width: 0; }
    .sheet .open { padding: 2px 8px; font-size: 12px; flex: none; }
    textarea { width: 100%; min-height: 64px; margin: 8px 0; padding: 8px; border-radius: 8px; border: 1px solid #3f3f46;
      background: #09090b; color: #fafafa; font-size: 16px; resize: vertical; }
    .row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .sheet button, .chip, .toast button { border: 1px solid #3f3f46; background: #27272a; color: #fafafa; border-radius: 6px; padding: 6px 10px; font-size: 13px; cursor: pointer; }
    .primary { background: #7c3aed !important; border-color: #7c3aed !important; margin-left: auto; }
    h3 { margin: 0 0 8px; font-size: 14px; }
    ul { list-style: none; margin: 0 0 10px; padding: 0; }
    li { display: grid; grid-template-columns: 22px 1fr auto; gap: 8px; align-items: start; padding: 6px 0; border-bottom: 1px solid #27272a; }
    .num { width: 22px; height: 22px; border-radius: 50%; background: #7c3aed; font: 600 12px/22px ui-sans-serif, system-ui, sans-serif; text-align: center; }
    .say { font-size: 14px; } .what { font: 11px ui-monospace, monospace; color: #a1a1aa; word-break: break-all; }
    li button { padding: 2px 8px !important; }
    .empty { color: #a1a1aa; font-size: 13px; margin: 0 0 10px; }
    .chip { position: fixed; z-index: 2147483647; background: #18181b; box-shadow: 0 4px 16px rgba(0,0,0,.3); display: none; }
    .toasts { position: fixed; z-index: 2147483647; left: 12px; right: 12px; top: calc(12px + env(safe-area-inset-top, 0px));
      display: flex; flex-direction: column; align-items: flex-start; gap: 6px; pointer-events: none; }
    .toast { background: #18181b; color: #fafafa; padding: 8px 10px; border-radius: 8px; font-size: 13px; max-width: 100%;
      box-shadow: 0 4px 16px rgba(0,0,0,.3); display: flex; gap: 8px; align-items: center; pointer-events: auto; }
    label.auto { font-size: 12px; color: #a1a1aa; display: flex; gap: 4px; align-items: center; }
  </style>
  <div class="layer"><div class="box hover"><span class="tag"></span></div><div class="box marquee"></div><div class="marks"></div></div>
  <div class="toasts"></div>
  <button class="chip" type="button">💬 Annotate</button>
  <div class="sheet panel" role="dialog" aria-label="Add a note">
    <div class="label"></div>
    <div class="where"><div class="hint"></div><button class="open" type="button" title="Open this file in your editor">↗ Open</button></div>
    <textarea placeholder="What should change? (⌘/Ctrl+Enter to add)"></textarea>
    <div class="row">
      <button class="up" type="button" title="Select parent">⬆ parent</button>
      <button class="down" type="button" title="Select first child">⬇ child</button>
      <button class="cancel" type="button">Cancel</button>
      <button class="primary add" type="button">Add note</button>
    </div>
  </div>
  <div class="sheet tray" role="dialog" aria-label="Notes">
    <h3>Notes to send</h3>
    <ul class="notes"></ul>
    <p class="empty">No notes yet. Press ◎, then tap or drag on the page.</p>
    <div class="row">
      <button class="copy" type="button">Copy markdown</button>
      <button class="clear" type="button">Clear</button>
      <button class="primary send" type="button">Send to agent</button>
    </div>
  </div>
  <div class="tools">
    <button data-act="pick" aria-pressed="false" title="Annotate (Alt+Shift+E)" aria-label="Annotate">◎</button>
    <button data-act="freeze" class="freeze" aria-pressed="false" title="Pause animations (Alt+Shift+P)" aria-label="Pause animations">⏸</button>
    <button data-act="tray" aria-label="Notes">🗒 <span class="count">0</span><span class="busy"></span></button>
    <button data-act="send" class="go" disabled>Send</button>
  </div>`;
  document.documentElement.appendChild(host);

  const $ = s => root.querySelector(s);
  const hoverBox = $('.box.hover'), marquee = $('.box.marquee'), marks = $('.marks');
  const panel = $('.panel'), tray = $('.tray'), ta = $('textarea'), chip = $('.chip'), tools = $('.tools');

  let picking = false, frozen = false, draft = null, drag = null, raf = 0;
  let notes = [];   // { ...snapshot, els: [live elements or null] }
  const isOurs = el => el === host || host.contains(el);
  const pageEl = el => el && el.nodeType === 1 && !isOurs(el) && el !== document.documentElement && el !== document.body;

  // ---------------------------------------------------------------- context
  function label(el) {
    let s = el.localName;
    if (el.id) s += '#' + el.id;
    const cls = [...el.classList].slice(0, 3);
    if (cls.length) s += '.' + cls.join('.');
    if (el.classList.length > 3) s += '…';
    return s;
  }

  function cssPath(el) {
    const uniq = id => { try { return document.querySelectorAll('#' + CSS.escape(id)).length === 1; } catch { return false; } };
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.documentElement) {
      if (el.id && uniq(el.id)) { parts.unshift('#' + CSS.escape(el.id)); break; }
      let part = el.localName;
      const cls = [...el.classList].filter(c => c.length < 40).slice(0, 2);
      if (cls.length) part += '.' + cls.map(c => CSS.escape(c)).join('.');
      const parent = el.parentElement;
      if (parent) {
        const sibs = [...parent.children].filter(s => s.localName === el.localName);
        if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(el) + 1})`;
      }
      parts.unshift(part);
      el = parent;
    }
    return parts.join(' > ');
  }

  // Rails: config.action_view.annotate_rendered_view_with_filenames = true → <!-- BEGIN app/views/... -->
  function railsTemplates(el) {
    const stack = [];
    const w = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
    let c;
    while ((c = w.nextNode())) {
      if (!(c.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) break;
      const m = c.data.trim().match(/^(BEGIN|END)\s+(\S+)/);
      if (!m) continue;
      if (m[1] === 'BEGIN') stack.push(m[2]);
      else { const i = stack.lastIndexOf(m[2]); if (i >= 0) stack.splice(i); }
    }
    return stack;
  }

  function hints(el) {
    const h = { rails: railsTemplates(el), svelte: [], react: [], vue: [] };
    for (let n = el; n && h.svelte.length < 3; n = n.parentElement) {
      const loc = n.__svelte_meta?.loc;
      if (loc?.file) { const s = `${loc.file}:${loc.line}:${loc.column}`; if (!h.svelte.includes(s)) h.svelte.push(s); }
    }
    for (let n = el; n && !h.react.length; n = n.parentElement) {
      const key = Object.keys(n).find(k => k.startsWith('__reactFiber$'));
      if (!key) continue;
      for (let f = n[key]; f && h.react.length < 6; f = f.return) {
        if (typeof f.type !== 'function' && typeof f.type !== 'object') continue;
        const name = f.type?.displayName || f.type?.name || f.type?.render?.name;
        if (!name) continue;
        const src = f._debugSource ? ` (${f._debugSource.fileName}:${f._debugSource.lineNumber})` : '';
        h.react.push(name + src);
      }
    }
    for (let n = el; n && !h.vue.length; n = n.parentElement) {
      for (let c = n.__vueParentComponent; c && h.vue.length < 6; c = c.parent) {
        const t = c.type || {};
        const s = t.__file || t.name || t.__name;
        if (s) h.vue.push(s);
      }
    }
    return h;
  }
  const bestHint = h => h.svelte[0] || h.rails.at(-1) || h.vue[0] || h.react[0] || '';
  // { file, line?, column? } from the best hint that names a file, or null (a bare component name)
  function fileHint(h) {
    for (const s of [h.svelte[0], h.rails.at(-1), h.vue[0], h.react.find(r => r.endsWith(')'))]) {
      const m = s && (s.match(/\((.+):(\d+)\)$/) || s.match(/^([^\s()]+\.\w+)(?::(\d+))?(?::(\d+))?$/));
      if (m) return { file: m[1], ...(m[2] ? { line: +m[2] } : {}), ...(m[3] ? { column: +m[3] } : {}) };
    }
    return null;
  }

  function elementContext(el) {
    const cs = getComputedStyle(el);
    const styles = {};
    for (const p of STYLE_PROPS) { const v = cs.getPropertyValue(p); if (v && v !== 'none' && v !== 'normal' && v !== 'auto') styles[p] = v; }
    let html = el.outerHTML;
    if (html.length > 4000) html = html.slice(0, 4000) + '\n<!-- …truncated by punchlist -->';
    const ancestors = [];
    for (let n = el.parentElement; n && n !== document.body && ancestors.length < 4; n = n.parentElement) ancestors.unshift(label(n));
    const r = el.getBoundingClientRect();
    return {
      label: label(el), selector: cssPath(el), ancestors,
      text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 300),
      html, styles, rect: { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }, hints: hints(el),
    };
  }

  function describe(n) {
    if (n.kind === 'text') return `text “${n.text.length > 40 ? n.text.slice(0, 40) + '…' : n.text}” in ${n.elements[0].label}`;
    if (n.kind === 'elements') return `${n.elements.length} elements: ${n.elements.map(e => e.label).join(', ')}`;
    if (n.kind === 'area') return `area ${Math.round(n.area.width)}×${Math.round(n.area.height)} in ${n.elements[0].label}`;
    return n.elements[0].label;
  }

  // ---------------------------------------------------------------- persistence (survives reloads / Turbo visits)
  function save() {
    try { sessionStorage.setItem(STORE, JSON.stringify(notes.map(({ els, ...n }) => n))); } catch {}
  }
  function restore() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) || '[]');
      notes = saved.map(n => ({ ...n, els: n.path === here() ? n.elements.map(e => { try { return document.querySelector(e.selector); } catch { return null; } }) : [] }));
    } catch { notes = []; }
  }
  const here = () => location.pathname + location.search;

  // ---------------------------------------------------------------- overlay rendering
  function placeBox(box, r, text) {
    Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    box.classList.toggle('flip', r.top < 24);
    const tag = box.querySelector('.tag'); if (tag && text != null) tag.textContent = text;
  }
  const areaRect = a => ({ left: a.x - scrollX, top: a.y - scrollY, width: a.width, height: a.height });

  function renderMarks() {
    marks.innerHTML = '';
    const items = [];
    const add = (cls, getRect, ok, text, pinNo) => {
      const b = document.createElement('div'); b.className = 'box ' + cls;
      if (text) b.innerHTML = '<span class="tag"></span>';
      marks.append(b);
      items.push({ node: b, getRect, ok, text });
      if (pinNo) {
        const p = document.createElement('div'); p.className = 'pin'; p.textContent = pinNo; marks.append(p);
        items.push({ node: p, pin: true, getRect, ok });
      }
    };
    notes.forEach((n, i) => {
      if (n.path !== here()) return;
      if (n.kind === 'area') return add('noted', () => areaRect(n.area), () => true, null, i + 1);
      n.els.forEach((el, j) => el && add('noted', () => el.getBoundingClientRect(), () => el.isConnected, null, j === 0 ? i + 1 : null));
    });
    if (draft) {
      if (draft.kind === 'area') add('draft', () => areaRect(draft.area), () => true, draft.desc);
      else draft.els.forEach((el, j) => add('draft', () => el.getBoundingClientRect(), () => el.isConnected, j === 0 ? draft.desc : null));
    }
    cancelAnimationFrame(raf);
    const tick = () => {
      for (const it of items) {
        if (!it.ok()) { it.node.style.display = 'none'; continue; }
        const r = it.getRect();
        if (it.pin) { it.node.style.left = r.left + 'px'; it.node.style.top = r.top + 'px'; }
        else placeBox(it.node, r, it.text);
      }
      if (items.length) raf = requestAnimationFrame(tick);
    };
    tick();
  }

  function refresh() {
    $('.count').textContent = notes.length;
    const go = tools.querySelector('.go');
    go.disabled = !notes.length;
    go.textContent = notes.length ? `Send ${notes.length}` : 'Send';
    tray.querySelector('.send').disabled = !notes.length;
    $('.empty').style.display = notes.length ? 'none' : 'block';
    const list = $('.notes'); list.innerHTML = '';
    notes.forEach((n, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="num"></span><div><div class="say"></div><div class="what"></div></div><button type="button" aria-label="Remove note">×</button>';
      li.querySelector('.num').textContent = i + 1;
      li.querySelector('.say').textContent = n.comment;
      li.querySelector('.what').textContent = `${describe(n)}${n.path !== here() ? `  (${n.path})` : ''}`;
      li.querySelector('button').onclick = () => { notes.splice(i, 1); save(); refresh(); renderMarks(); };
      list.append(li);
    });
  }

  function openSheet(which) {
    panel.style.display = which === 'panel' ? 'block' : 'none';
    tray.style.display = which === 'tray' ? 'block' : 'none';
  }

  function toast(text, actions, ms = 5000) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = text;
    if (actions) t.append(actions);
    $('.toasts').append(t);
    setTimeout(() => t.remove(), actions ? 15000 : ms);
  }

  // ---------------------------------------------------------------- modes
  function setPicking(on) {
    picking = on;
    tools.querySelector('[data-act="pick"]').setAttribute('aria-pressed', on);
    const ds = document.documentElement.style;
    ds.cursor = on ? 'crosshair' : '';
    ds.touchAction = on ? 'none' : '';
    ds.userSelect = ds.webkitUserSelect = on ? 'none' : '';
    if (!on) hoverBox.style.display = 'none';
    if (on) { hideChip(); getSelection()?.removeAllRanges(); }
  }

  let freezeStyle = null;
  function setFrozen(on) {
    frozen = on;
    tools.querySelector('[data-act="freeze"]').setAttribute('aria-pressed', on);
    if (on) {
      freezeStyle = document.createElement('style');
      freezeStyle.textContent = '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }';
      document.head.append(freezeStyle);
    } else freezeStyle?.remove();
    for (const a of document.getAnimations?.() || []) { try { on ? a.pause() : a.play(); } catch {} }
    document.querySelectorAll('video, audio').forEach(m => { if (on) { m.dataset.peWasPlaying = !m.paused; m.pause(); } else if (m.dataset.peWasPlaying === 'true') m.play().catch(() => {}); });
    toast(on ? '⏸ Animations paused' : '▶︎ Animations resumed', null, 2500);
  }

  tools.addEventListener('click', e => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'pick') { cancelDraft(); setPicking(!picking); }
    if (act === 'freeze') setFrozen(!frozen);
    if (act === 'tray') { cancelDraft(); openSheet(tray.style.display === 'block' ? null : 'tray'); }
    if (act === 'send') send();
  });

  // ---------------------------------------------------------------- drafting
  function startDraft(d) {
    draft = d;
    hoverBox.style.display = 'none';
    const snap = snapshot(d);
    d.desc = describe(snap);
    $('.label').textContent = d.desc;
    $('.hint').textContent = bestHint(snap.elements[0].hints) || snap.elements[0].selector;
    d.file = fileHint(snap.elements[0].hints);
    $('.open').style.display = d.file ? '' : 'none';
    const single = d.kind === 'element';
    $('.up').style.display = $('.down').style.display = single ? '' : 'none';
    // keep the target visible: a target in the lower half gets the sheet at the top
    const r = d.area ? { top: d.area.y - scrollY, bottom: d.area.y - scrollY + d.area.height } : d.els[0].getBoundingClientRect();
    panel.classList.toggle('top', (r.top + r.bottom) / 2 > innerHeight / 2);
    openSheet('panel');
    renderMarks();
    // focus inside the gesture: early keys aren't lost and iOS opens the keyboard
    ta.focus({ preventScroll: true });
  }
  function snapshot(d) {
    return { kind: d.kind, path: here(), title: document.title, text: d.text, area: d.area, frozen, elements: d.els.map(elementContext) };
  }
  function cancelDraft() { if (!draft) return; draft = null; ta.value = ''; openSheet(null); renderMarks(); }
  function addNote() {
    const comment = ta.value.trim();
    if (!draft || !comment) return ta.focus();
    notes.push({ ...snapshot(draft), comment, els: draft.els });
    ta.value = '';
    draft = null;
    openSheet(null);
    save(); refresh(); renderMarks();
    toast(`📝 Note ${notes.length} added${picking ? ' — tap the next spot' : ''}`, null, 2500);
  }
  $('.add').onclick = addNote;
  // the proxy opens it on the dev machine, so this also works from a phone
  $('.open').onclick = async () => {
    if (!draft?.file) return;
    try {
      const r = await fetch(API + '/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(draft.file) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || r.status);
      toast(`↗ Opened ${b.file} in your editor`, null, 2500);
    } catch (e) { toast(`❌ Open failed: ${e.message}`); }
  };
  $('.cancel').onclick = cancelDraft;
  $('.up').onclick = () => { const p = draft?.els[0].parentElement; if (pageEl(p)) startDraft({ kind: 'element', els: [p] }); };
  $('.down').onclick = () => { const c = draft?.els[0].firstElementChild; if (c) startDraft({ kind: 'element', els: [c] }); };
  for (const t of ['keydown', 'keyup', 'keypress']) ta.addEventListener(t, e => e.stopPropagation());
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote(); });

  // ---------------------------------------------------------------- pick: tap / drag
  const at = (x, y) => { host.style.display = 'none'; const el = document.elementFromPoint(x, y); host.style.display = ''; return pageEl(el) ? el : null; };
  const swallow = e => { if (picking && !isOurs(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); } };
  for (const t of ['mousedown', 'mouseup', 'touchstart', 'touchend', 'dblclick', 'contextmenu', 'click'])
    document.addEventListener(t, swallow, { capture: true, passive: false });

  document.addEventListener('pointerdown', e => {
    if (!picking || isOurs(e.target)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    drag = { x: e.clientX, y: e.clientY, moved: false };
  }, true);
  document.addEventListener('pointermove', e => {
    if (!picking) return;
    if (drag) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true;
      if (drag.moved) {
        hoverBox.style.display = 'none';
        marquee.style.display = 'block';
        placeBox(marquee, { left: Math.min(drag.x, e.clientX), top: Math.min(drag.y, e.clientY), width: Math.abs(e.clientX - drag.x), height: Math.abs(e.clientY - drag.y) });
      }
      return;
    }
    if (e.pointerType !== 'mouse' || draft || isOurs(e.target)) return;
    const el = at(e.clientX, e.clientY);
    if (el) { hoverBox.style.display = 'block'; placeBox(hoverBox, el.getBoundingClientRect(), label(el)); }
  }, true);
  document.addEventListener('pointerup', e => {
    if (!picking || !drag) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const d = drag; drag = null;
    marquee.style.display = 'none';
    if (!d.moved) { const el = at(e.clientX, e.clientY); if (el) startDraft({ kind: 'element', els: [el] }); return; }
    const sel = { left: Math.min(d.x, e.clientX), top: Math.min(d.y, e.clientY), right: Math.max(d.x, e.clientX), bottom: Math.max(d.y, e.clientY) };
    const fits = r => r.width > 0 && r.height > 0 && r.left >= sel.left - 2 && r.right <= sel.right + 2 && r.top >= sel.top - 2 && r.bottom <= sel.bottom + 2;
    // block elements are wider than their text, so also accept an element whose content fits
    const contentRect = el => { const rg = document.createRange(); rg.selectNodeContents(el); return rg.getBoundingClientRect(); };
    const inside = [...document.body.querySelectorAll('*')].filter(el =>
      !isOurs(el) && (fits(el.getBoundingClientRect()) || (el.textContent.trim() && fits(contentRect(el)))));
    const tops = inside.filter(el => !inside.some(o => o !== el && o.contains(el))).slice(0, MAX_ELS);
    if (tops.length === 1) return startDraft({ kind: 'element', els: tops });
    if (tops.length > 1) return startDraft({ kind: 'elements', els: tops });
    // empty space → annotate the area, anchored to the smallest element containing it
    let anchor = at((sel.left + sel.right) / 2, (sel.top + sel.bottom) / 2) || document.body;
    while (anchor.parentElement && pageEl(anchor.parentElement)) {
      const r = anchor.getBoundingClientRect();
      if (r.left <= sel.left && r.right >= sel.right && r.top <= sel.top && r.bottom >= sel.bottom) break;
      anchor = anchor.parentElement;
    }
    startDraft({ kind: 'area', els: [anchor], area: { x: sel.left + scrollX, y: sel.top + scrollY, width: sel.right - sel.left, height: sel.bottom - sel.top } });
  }, true);
  addEventListener('scroll', () => { hoverBox.style.display = 'none'; hideChip(); }, true);

  document.addEventListener('keydown', e => {
    if (e.altKey && e.shiftKey && e.code === 'KeyE') { e.preventDefault(); cancelDraft(); setPicking(!picking); }
    else if (e.altKey && e.shiftKey && e.code === 'KeyP') { e.preventDefault(); setFrozen(!frozen); }
    else if (e.key === 'Escape' && (picking || draft || tray.style.display === 'block')) {
      if (draft) cancelDraft(); else if (picking) setPicking(false); else openSheet(null);
    }
  }, true);

  // ---------------------------------------------------------------- text selection
  let pendingText = null, selTimer = 0;
  function hideChip() { chip.style.display = 'none'; pendingText = null; }
  document.addEventListener('selectionchange', () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => {
      const s = getSelection();
      if (picking || !s || s.isCollapsed || !s.rangeCount) return hideChip();
      const range = s.getRangeAt(0);
      let el = range.commonAncestorContainer;
      if (el.nodeType !== 1) el = el.parentElement;
      const text = s.toString().trim();
      if (!pageEl(el) || !text || el.closest('input, textarea, [contenteditable]')) return hideChip();
      pendingText = { el, text: text.slice(0, 300) };
      const r = range.getBoundingClientRect();
      chip.style.display = 'block';
      chip.style.left = Math.max(8, Math.min(r.left, innerWidth - 130)) + 'px';
      chip.style.top = Math.min(r.bottom + 8, innerHeight - 120) + 'px';
    }, 120);
  });
  chip.addEventListener('pointerdown', e => e.preventDefault());
  chip.addEventListener('click', () => {
    if (!pendingText) return;
    const d = { kind: 'text', els: [pendingText.el], text: pendingText.text };
    hideChip();
    getSelection()?.removeAllRanges();
    startDraft(d);
  });

  // ---------------------------------------------------------------- markdown (copy) + send
  function markdown(list) {
    const out = [`## Page feedback (${list.length} note${list.length > 1 ? 's' : ''})`, `Viewport ${innerWidth}×${innerHeight}`, ''];
    list.forEach((n, i) => {
      out.push(`### ${i + 1}. ${describe(n)}${n.frozen ? ' (animations paused)' : ''}`);
      out.push(`Page: ${n.path}`);
      const hint = bestHint(n.elements[0].hints); if (hint) out.push(`Source: ${hint}`);
      out.push(`Selector: ${n.elements.map(e => e.selector).join(' , ')}`);
      if (n.kind === 'text') out.push(`Selected text: "${n.text}"`);
      out.push(`Note: ${n.comment}`, '');
    });
    return out.join('\n');
  }
  tray.querySelector('.copy').onclick = async () => {
    try { await navigator.clipboard.writeText(markdown(notes)); toast('📋 Copied', null, 2000); }
    catch { toast('❌ Clipboard not available here'); }
  };
  tray.querySelector('.clear').onclick = () => { notes = []; save(); refresh(); renderMarks(); };
  tray.querySelector('.send').onclick = send;

  async function send() {
    if (!notes.length) return;
    const batch = notes.map(({ els, ...n }) => n);
    try {
      const r = await fetch(API + '/requests', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notes: batch, viewport: { w: innerWidth, h: innerHeight } }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
      notes = []; save();
      cancelDraft(); openSheet(null); refresh(); renderMarks();
    } catch (e) { toast(`❌ Send failed: ${e.message}`); }
  }

  // ---------------------------------------------------------------- status (SSE)
  const state = new Map();
  const autoKey = '__pe_autoreload';
  const autoReload = () => { try { return localStorage.getItem(autoKey) === '1'; } catch { return false; } };
  function renderBusy() {
    const n = [...state.values()].filter(i => i.status === 'pending' || i.status === 'working').length;
    const b = $('.busy'); b.textContent = `⏳${n}`; b.style.display = n ? 'inline' : 'none';
  }
  function onUpdate(it, fresh) {
    const prev = state.get(it.id);
    state.set(it.id, it);
    renderBusy();
    if (!fresh || prev?.status === it.status) return;
    if (it.status === 'pending') toast(`📨 ${it.id} queued — ${it.label}`);
    if (it.status === 'working') toast(`🛠 ${it.id} agent is on it`);
    if (it.status === 'done' || it.status === 'failed') {
      if (it.status === 'done' && autoReload()) return location.reload();
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:flex;gap:6px;align-items:center;margin-left:auto';
      const btn = document.createElement('button'); btn.textContent = 'Reload'; btn.onclick = () => location.reload();
      const lab = document.createElement('label'); lab.className = 'auto';
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = autoReload();
      cb.onchange = () => { try { localStorage.setItem(autoKey, cb.checked ? '1' : '0'); } catch {} };
      lab.append(cb, 'auto');
      wrap.append(btn, lab);
      toast(`${it.status === 'done' ? '✅' : '❌'} ${it.id}${it.message ? ': ' + it.message : ''}`, wrap);
    }
  }
  try {
    const es = new EventSource(API + '/events');
    es.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'snapshot') for (const it of msg.items) onUpdate(it, false);
      else if (msg.type === 'update') onUpdate(msg.item, true);
    };
  } catch {}

  // ---------------------------------------------------------------- init (+ Turbo visits)
  function init() { restore(); refresh(); renderMarks(); }
  init();
  document.addEventListener('turbo:load', init);
  addEventListener('popstate', () => setTimeout(init, 0));
})();
