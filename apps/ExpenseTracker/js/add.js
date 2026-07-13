// add.js — log an expense in under 5 seconds. Keypad-first.
window.AddScreen = (() => {
  const el = () => document.getElementById('screen-add');
  const state = { amount: '', category: null, sub: null, note: '', date: Fmt.dateKey(new Date()) };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Most-recently / frequently used categories first.
  const rankedCategories = () => {
    const cats = Store.getCategories();
    const last = {}; const count = {};
    Store.allExpenses().forEach((e) => {
      count[e.category] = (count[e.category] || 0) + 1;
      last[e.category] = Math.max(last[e.category] || 0, e.createdAt || 0);
    });
    const used = cats.filter((c) => count[c.id]).sort((a, b) => (last[b.id] - last[a.id]) || (count[b.id] - count[a.id]));
    const rest = cats.filter((c) => !count[c.id]);
    return { ordered: [...used, ...rest], cats };
  };

  const defaultCategory = () => {
    const { ordered } = rankedCategories();
    return (ordered[0] && ordered[0].id) || 'misc';
  };

  const amountValue = () => parseFloat(state.amount || '0') || 0;
  const amountShown = () => {
    if (!state.amount) return { text: '0', placeholder: true };
    return { text: Fmt.inGroup(Math.floor(amountValue())) + (state.amount.includes('.') ? '.' + state.amount.split('.')[1] : ''), placeholder: false };
  };

  const datePillLabel = () => {
    const today = Fmt.dateKey(new Date());
    if (state.date === today) return 'Today';
    const d = Fmt.parseDateKey(state.date);
    return `${Fmt.DAYS_SHORT[d.getDay()]} ${d.getDate()} ${Fmt.MONTHS_SHORT[d.getMonth()]}`;
  };

  const render = () => {
    if (state.category == null) state.category = defaultCategory();
    const { ordered, cats } = rankedCategories();
    const shownCats = ordered.slice(0, 7);
    const selCat = Categories.byId(cats, state.category);
    const a = amountShown();

    el().innerHTML = `
      <div class="add-wrap">
        <div class="add-head">
          <span class="label">New expense</span>
          <label class="date-pill"><span id="date-label">${datePillLabel()}</span>
            <svg width="8" height="5" viewBox="0 0 8 5"><path d="M1 1l3 3 3-3" stroke="#6E6E74" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>
            <input type="date" id="add-date" value="${state.date}">
          </label>
        </div>

        <div class="amount-display" id="amount-display">
          <span class="cur">${Fmt.symbol}</span>
          <span class="val tnum ${a.placeholder ? 'placeholder' : ''}">${a.text}</span>
          <span class="caret"></span>
        </div>

        <div class="cat-block">
          <div class="label" style="margin-bottom:10px">Category</div>
          <div class="cat-scroll" id="cat-scroll">
            ${shownCats.map((c) => chip(c)).join('')}
            <button class="chip more" data-act="more">More…</button>
          </div>
          <div class="cat-scroll" id="sub-scroll" style="margin-top:8px">${subChips(selCat)}</div>
        </div>

        <div class="note-line" id="note-line">
          <input type="text" id="note-input" placeholder="Add note (optional)" value="${esc(state.note)}" enterkeyhint="done" maxlength="80">
        </div>

        <div class="keypad-area">
          <div class="keypad" id="keypad">
            ${[1,2,3,4,5,6,7,8,9].map((n) => `<button class="key" data-k="${n}">${n}</button>`).join('')}
            <button class="key muted" data-k=".">.</button>
            <button class="key" data-k="0">0</button>
            <button class="key" data-k="del" aria-label="Delete">
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none"><path d="M8 1.5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8L2 9l6-7.5z" stroke="#6E6E74" stroke-width="1.5" stroke-linejoin="round"/><path d="M11.5 6l6 6M17.5 6l-6 6" stroke="#6E6E74" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
          <button class="btn btn--primary btn--cta btn--block add-save" id="add-save">Save expense</button>
        </div>
      </div>`;

    wire();
  };

  const chip = (c) =>
    `<button class="chip ${c.id === state.category ? 'is-selected' : ''}" data-cat="${c.id}"><span class="emoji">${c.emoji}</span>${esc(c.name)}</button>`;

  const subChips = (cat) => {
    if (!cat || !cat.subs || !cat.subs.length) return '';
    return cat.subs.map((s) =>
      `<button class="chip ${s === state.sub ? 'is-selected' : ''}" data-sub="${esc(s)}" style="padding:9px 14px;font-size:14px">${esc(s)}</button>`
    ).join('');
  };

  const refreshAmount = () => {
    const a = amountShown();
    const disp = document.querySelector('#amount-display .val');
    if (disp) { disp.textContent = a.text; disp.classList.toggle('placeholder', a.placeholder); }
  };

  const selectCategory = (id) => {
    state.category = id; state.sub = null;
    document.querySelectorAll('#cat-scroll [data-cat]').forEach((n) =>
      n.classList.toggle('is-selected', n.getAttribute('data-cat') === id));
    const cats = Store.getCategories();
    document.getElementById('sub-scroll').innerHTML = subChips(Categories.byId(cats, id));
    bindSubs();
  };

  const bindSubs = () => {
    document.querySelectorAll('#sub-scroll [data-sub]').forEach((n) =>
      n.addEventListener('click', () => {
        const v = n.getAttribute('data-sub');
        state.sub = state.sub === v ? null : v;
        document.querySelectorAll('#sub-scroll [data-sub]').forEach((m) =>
          m.classList.toggle('is-selected', m.getAttribute('data-sub') === state.sub));
      }));
  };

  const press = (k) => {
    if (k === 'del') { state.amount = state.amount.slice(0, -1); refreshAmount(); return; }
    if (k === '.') {
      if (state.amount.includes('.')) return;
      state.amount = (state.amount || '0') + '.'; refreshAmount(); return;
    }
    // digit
    if (state.amount.includes('.')) {
      const dec = state.amount.split('.')[1];
      if (dec.length >= 2) return;
    }
    if (state.amount.replace('.', '').length >= 9) return;
    if (state.amount === '0') state.amount = '';
    state.amount += k;
    refreshAmount();
  };

  const save = () => {
    if (amountValue() <= 0) {
      const d = document.getElementById('amount-display');
      d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake');
      App.toast('Amount required', { warn: true });
      return;
    }
    const cats = Store.getCategories();
    const catName = Categories.name(cats, state.category);
    const payload = { amount: amountValue(), category: state.category, subcategory: state.sub, note: state.note.trim(), date: state.date };
    Store.addExpense(payload);
    App.toast(`${Fmt.money(payload.amount)} · ${state.sub || catName}`);
    // reset amount + note but remember category for fast repeat logging
    state.amount = ''; state.note = ''; state.sub = null; state.date = Fmt.dateKey(new Date());
    App.goto('dashboard');
  };

  const wire = () => {
    document.getElementById('keypad').querySelectorAll('.key').forEach((n) =>
      n.addEventListener('click', () => press(n.getAttribute('data-k'))));

    document.querySelectorAll('#cat-scroll [data-cat]').forEach((n) =>
      n.addEventListener('click', () => selectCategory(n.getAttribute('data-cat'))));
    bindSubs();

    document.querySelector('[data-act="more"]').addEventListener('click', openCategorySheet);

    const note = document.getElementById('note-input');
    const noteLine = document.getElementById('note-line');
    note.addEventListener('input', () => { state.note = note.value; });
    note.addEventListener('focus', () => noteLine.classList.add('focused'));
    note.addEventListener('blur', () => noteLine.classList.remove('focused'));

    const dateInput = document.getElementById('add-date');
    dateInput.addEventListener('change', () => {
      state.date = dateInput.value || Fmt.dateKey(new Date());
      document.getElementById('date-label').textContent = datePillLabel();
    });

    document.getElementById('add-save').addEventListener('click', save);
  };

  const openCategorySheet = () => {
    const cats = Store.getCategories();
    App.sheet({
      title: 'Choose category',
      bodyHTML: `<div class="sheet-chips">${cats.map((c) =>
        `<button class="chip ${c.id === state.category ? 'is-selected' : ''}" data-pick="${c.id}"><span class="emoji">${c.emoji}</span>${esc(c.name)}</button>`).join('')}</div>`,
      onMount: (root, close) => {
        root.querySelectorAll('[data-pick]').forEach((n) =>
          n.addEventListener('click', () => {
            const id = n.getAttribute('data-pick');
            // Ensure it shows as a top chip: re-render and select.
            state.category = id; state.sub = null;
            render();
            close();
          }));
      },
    });
  };

  // reset when leaving/entering fresh
  const onEnter = () => { state.date = Fmt.dateKey(new Date()); if (state.category == null) state.category = defaultCategory(); render(); };

  return { render, onEnter };
})();
