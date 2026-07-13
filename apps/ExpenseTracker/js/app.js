// app.js — router, overlays (toast/sheet/dialog/prompt) and boot.
window.App = (() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const screens = { dashboard: Dashboard, add: AddScreen, history: History, insights: Insights, settings: Settings };
  let activeTab = 'dashboard';
  let settingsOpen = false;
  let unsub = null;

  // ---- routing ---------------------------------------------------------
  const setScreenActive = (tab) => {
    ['dashboard', 'add', 'history', 'insights'].forEach((t) =>
      $(`screen-${t}`).classList.toggle('is-active', t === tab));
    document.querySelectorAll('#tabbar .tab').forEach((b) =>
      b.classList.toggle('is-active', b.getAttribute('data-goto') === tab));
  };

  const goto = (tab) => {
    if (settingsOpen) closeSettings();
    setScreenActive(tab);
    activeTab = tab;
    const mod = screens[tab];
    if (mod && (mod.onEnter || mod.render)) (mod.onEnter || mod.render)();
  };

  const openSettings = () => {
    settingsOpen = true;
    Settings.render();
    $('screen-settings').classList.add('is-active');
  };
  const closeSettings = () => {
    settingsOpen = false;
    $('screen-settings').classList.remove('is-active');
  };

  // Re-render the active data screen when the store changes.
  const rerender = () => {
    if (settingsOpen) Settings.render();
    if (activeTab === 'add') return;             // don't clobber in-progress entry
    const mod = screens[activeTab];
    if (mod && mod.render) mod.render();
  };

  // ---- count-up --------------------------------------------------------
  const animateValue = (node, to, fmt) => {
    const dur = 400, start = performance.now(), from = 0;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      node.textContent = fmt(from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(step);
      else node.textContent = fmt(to);
    };
    requestAnimationFrame(step);
  };

  // ---- toast -----------------------------------------------------------
  let toastTimer = null;
  const toast = (msg, opts = {}) => {
    const host = $('toast-host');
    host.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'toast' + (opts.warn ? ' warn' : '');
    t.innerHTML = `<span class="dot"></span><span>${esc(msg)}</span>`;
    if (opts.undo) {
      const u = document.createElement('span'); u.className = 'undo'; u.textContent = 'Undo';
      u.addEventListener('click', () => { opts.undo(); dismiss(); });
      t.appendChild(u);
    }
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    if (navigator.vibrate) { try { navigator.vibrate(opts.warn ? 30 : 8); } catch (e) {} }
    clearTimeout(toastTimer);
    const dismiss = () => { t.classList.remove('show'); setTimeout(() => t.remove(), 260); };
    toastTimer = setTimeout(dismiss, opts.undo ? 4000 : 2500);
  };

  // ---- sheet -----------------------------------------------------------
  let sheetClose = null;
  const sheet = (opts) => {
    closeSheet();
    const host = $('sheet-host');
    host.style.pointerEvents = 'auto';
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const s = document.createElement('div'); s.className = 'sheet';
    s.innerHTML = `<div class="sheet-grip"></div>
      ${opts.headHTML || (opts.title ? `<div class="sheet-title">${esc(opts.title)}</div>` : '')}
      <div class="sheet-content">${opts.bodyHTML || ''}</div>
      ${opts.primary ? `<button class="btn btn--primary btn--block" style="margin-top:18px" data-primary>${esc(opts.primary)}</button>` : ''}`;
    host.appendChild(scrim); host.appendChild(s);
    requestAnimationFrame(() => { scrim.classList.add('show'); s.classList.add('show'); });

    const close = () => {
      scrim.classList.remove('show'); s.classList.remove('show');
      setTimeout(() => { scrim.remove(); s.remove(); host.style.pointerEvents = 'none'; }, 350);
      sheetClose = null;
    };
    sheetClose = close;
    scrim.addEventListener('click', close);
    // drag-down to dismiss
    let sy = 0, dy = 0, drag = false;
    const grip = s.querySelector('.sheet-grip');
    grip.addEventListener('pointerdown', (e) => { drag = true; sy = e.clientY; grip.setPointerCapture(e.pointerId); });
    grip.addEventListener('pointermove', (e) => { if (!drag) return; dy = Math.max(0, e.clientY - sy); s.style.transform = `translateY(${dy}px)`; });
    grip.addEventListener('pointerup', () => { drag = false; if (dy > 90) close(); else s.style.transform = ''; dy = 0; });

    if (opts.onMount) opts.onMount(s, close);
    const pb = s.querySelector('[data-primary]');
    if (pb) pb.addEventListener('click', () => { opts.onPrimary ? opts.onPrimary(s, close) : close(); });
    return close;
  };
  const closeSheet = () => { if (sheetClose) sheetClose(); };

  // ---- dialog ----------------------------------------------------------
  const dialog = (opts) => {
    const host = $('dialog-host'); host.innerHTML = ''; host.style.pointerEvents = 'auto';
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const d = document.createElement('div'); d.className = 'dialog';
    d.innerHTML = `<div class="dialog-body"><div class="dialog-title">${esc(opts.title)}</div>${opts.message ? `<div class="dialog-msg">${esc(opts.message)}</div>` : ''}</div>
      <div class="dialog-actions"><button data-cancel>${esc(opts.cancel || 'Cancel')}</button><button class="${opts.destructive ? 'destructive' : ''}" data-confirm>${esc(opts.confirm || 'OK')}</button></div>`;
    host.appendChild(scrim); host.appendChild(d);
    requestAnimationFrame(() => { scrim.classList.add('show'); d.classList.add('show'); });
    const close = () => { scrim.classList.remove('show'); d.classList.remove('show'); setTimeout(() => { host.innerHTML = ''; host.style.pointerEvents = 'none'; }, 250); };
    scrim.addEventListener('click', close);
    d.querySelector('[data-cancel]').addEventListener('click', close);
    d.querySelector('[data-confirm]').addEventListener('click', () => { close(); opts.onConfirm && opts.onConfirm(); });
  };

  // ---- prompt (small form sheet) ---------------------------------------
  const prompt = (opts, cb) => {
    const fields = opts.fields || [{ id: 'value', placeholder: opts.placeholder || '' }];
    sheet({
      title: opts.title,
      bodyHTML: `<div class="sheet-rows">${fields.map((f) =>
        `<div class="sheet-row"><span class="k">${esc(f.placeholder || f.id)}</span><input id="pf-${f.id}" value="${esc(f.value || '')}" style="${f.width ? 'width:' + f.width : ''}"></div>`).join('')}</div>`,
      primary: opts.primary || 'Add',
      onMount: (root) => { const first = root.querySelector('input'); if (first) setTimeout(() => first.focus(), 350); },
      onPrimary: (root, close) => {
        const vals = {}; fields.forEach((f) => { vals[f.id] = root.querySelector(`#pf-${f.id}`).value.trim(); });
        close(); cb(vals);
      },
    });
  };

  // ---- month picker ----------------------------------------------------
  const openMonthPicker = () => {
    const now = new Date();
    const withData = new Set(Store.monthsWithData());
    const opts = [];
    for (let i = 0; i < 15; i++) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); opts.push(Fmt.monthKey(d)); }
    Store.monthsWithData().forEach((m) => { if (!opts.includes(m)) opts.push(m); });
    opts.sort().reverse();
    sheet({
      title: 'Select month',
      bodyHTML: `<div class="sheet-rows">${opts.map((mk) => `<div class="sheet-row tap" data-mk="${mk}" style="cursor:pointer">
        <span class="k">${Fmt.monthLabel(mk)}${mk === Fmt.monthKey(now) ? ' · This month' : ''}</span>
        <span class="v">${withData.has(mk) ? Fmt.money(Store.getExpenses(mk).reduce((s, e) => s + e.amount, 0)) : ''} ${mk === Store.currentMonth ? '✓' : ''}</span></div>`).join('')}</div>`,
      onMount: (root, close) => {
        root.querySelectorAll('[data-mk]').forEach((n) => n.addEventListener('click', () => {
          Store.setMonth(n.getAttribute('data-mk'));
          if (Dashboard.resetCount) Dashboard.resetCount();
          close();
        }));
      },
    });
  };

  // ---- budget sheet ----------------------------------------------------
  const openBudgetSheet = () => {
    const b = Store.getBudget(Store.currentMonth);
    sheet({
      title: 'Monthly budget',
      bodyHTML: `<div class="sheet-rows"><div class="sheet-row"><span class="k">Budget for ${Fmt.monthLabel(Store.currentMonth)}</span>
        <input id="bud-input" class="tnum" inputmode="numeric" placeholder="e.g. 40000" value="${b.monthly || ''}"></div></div>
        <div class="ins-caption" style="margin-top:12px">This becomes your default budget every month. You can fine-tune category budgets in Settings.</div>`,
      primary: 'Save budget',
      onMount: (root) => setTimeout(() => root.querySelector('#bud-input').focus(), 350),
      onPrimary: (root, close) => {
        Store.setDefaultBudget(parseFloat(root.querySelector('#bud-input').value) || 0);
        close(); toast('Budget saved');
      },
    });
  };

  // ---- boot ------------------------------------------------------------
  const start = () => {
    document.querySelectorAll('#tabbar .tab').forEach((b) =>
      b.addEventListener('click', () => goto(b.getAttribute('data-goto'))));
    if (unsub) unsub();
    unsub = Store.on(rerender);
    if (Dashboard.resetCount) Dashboard.resetCount();
    goto('dashboard');
  };
  const stop = () => { if (unsub) { unsub(); unsub = null; } closeSheet(); settingsOpen = false; };

  return {
    start, stop, goto,
    openSettings, closeSettings, openMonthPicker, openBudgetSheet,
    toast, sheet, closeSheet, dialog, prompt, animateValue,
  };
})();

document.addEventListener('DOMContentLoaded', () => { window.Auth.init(); });
