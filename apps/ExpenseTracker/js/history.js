// history.js — reverse-chronological list with search, filters, swipe & edit.
window.History = (() => {
  const el = () => document.getElementById('screen-history');
  const st = { q: '', cat: 'all', range: null, filtersOpen: false };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const filtered = () => {
    const cats = Store.getCategories();
    let list = Store.getExpenses(Store.currentMonth);
    if (st.cat !== 'all') list = list.filter((e) => e.category === st.cat);
    if (st.range) list = list.filter((e) => e.date >= st.range.from && e.date <= st.range.to);
    if (st.q.trim()) {
      const q = st.q.trim().toLowerCase();
      list = list.filter((e) => {
        const hay = [Categories.name(cats, e.category), e.subcategory, e.note, String(e.amount)]
          .filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  };

  const render = () => {
    const cats = Store.getCategories();
    const list = filtered();
    const total = list.reduce((s, e) => s + e.amount, 0);

    // group by day
    const groups = {};
    list.forEach((e) => { (groups[e.date] = groups[e.date] || []).push(e); });
    const dayKeys = Object.keys(groups).sort().reverse();

    const presentCats = [...new Set(Store.getExpenses(Store.currentMonth).map((e) => e.category))];

    el().innerHTML = `
      <div class="hist-sticky" style="position:sticky;top:0;z-index:3;background:var(--bg)">
        <div class="scr-head">
          <div class="scr-title">History</div>
          <button class="month-pill" data-act="month">${Fmt.monthShort(Store.currentMonth)}
            <svg width="8" height="5" viewBox="0 0 8 5"><path d="M1 1l3 3 3-3" stroke="#6E6E74" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="scr-sub tnum">${list.length} ${list.length === 1 ? 'expense' : 'expenses'} · ${Fmt.moneyR(total)}</div>
        <div class="hist-tools">
          <div class="search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#6E6E74" stroke-width="1.6"/><path d="M11 11l3.5 3.5" stroke="#6E6E74" stroke-width="1.6" stroke-linecap="round"/></svg>
            <input type="search" id="hist-search" placeholder="Search" value="${esc(st.q)}" enterkeyhint="search">
          </div>
          <button class="icon-btn ${st.filtersOpen || st.cat !== 'all' || st.range ? 'is-active' : ''}" data-act="togglefilters" aria-label="Filters">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M4.5 9h9M7 14h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="filter-row" ${st.filtersOpen ? '' : 'hidden'}>
          <button class="fchip ${st.cat === 'all' ? 'is-selected' : ''}" data-cat="all">All</button>
          ${presentCats.map((id) => `<button class="fchip ${st.cat === id ? 'is-selected' : ''}" data-cat="${id}">${esc(Categories.name(cats, id))}</button>`).join('')}
          <button class="fchip ${st.range ? 'is-selected' : ''}" data-act="range">${st.range ? 'Custom range ✓' : 'Date range'}</button>
        </div>
      </div>

      <div class="hist-list" id="hist-list">
        ${list.length ? dayKeys.map((dk) => `
          <div class="day-group tnum"><span>${Fmt.dayGroupLabel(dk)}</span><span>${Fmt.moneyR(groups[dk].reduce((s, e) => s + e.amount, 0))}</span></div>
          ${groups[dk].map((e) => rowHTML(e, cats)).join('')}
        `).join('') : `<div class="empty"><div class="t">Nothing here</div><div class="d">${st.q || st.cat !== 'all' || st.range ? 'No expenses match your filters.' : 'No expenses logged this month yet.'}</div></div>`}
      </div>`;

    wire();
  };

  const rowHTML = (e, cats) => {
    const name = e.note || Categories.name(cats, e.category);
    const bits = [Categories.name(cats, e.category)];
    if (e.subcategory) bits.push(e.subcategory);
    return `<div class="hist-row-wrap" data-id="${e.id}">
      <div class="hist-actions">
        <button class="act edit" data-a="edit">Edit</button>
        <button class="act dup" data-a="dup">Copy</button>
        <button class="act del" data-a="del">Delete</button>
      </div>
      <div class="hist-row" data-row>
        <div class="l"><span class="name">${esc(name)}</span><span class="meta">${esc(bits.join(' · '))}</span></div>
        <span class="amt tnum">${Fmt.money(e.amount)}</span>
      </div>
    </div>`;
  };

  const OPEN_X = -228; // 3 × 76px

  const wire = () => {
    const search = document.getElementById('hist-search');
    if (search) {
      search.addEventListener('input', () => { st.q = search.value; renderList(); });
    }
    el().querySelectorAll('[data-act]').forEach((n) => n.addEventListener('click', () => {
      const a = n.getAttribute('data-act');
      if (a === 'month') App.openMonthPicker();
      else if (a === 'togglefilters') { st.filtersOpen = !st.filtersOpen; render(); }
      else if (a === 'range') openRangeSheet();
    }));
    el().querySelectorAll('.filter-row [data-cat]').forEach((n) => n.addEventListener('click', () => {
      st.cat = n.getAttribute('data-cat'); render();
    }));
    bindRows();
  };

  // Re-render only the list portion (keeps search input focus on typing).
  const renderList = () => {
    const cats = Store.getCategories();
    const list = filtered();
    const total = list.reduce((s, e) => s + e.amount, 0);
    const sub = el().querySelector('.scr-sub');
    if (sub) sub.textContent = `${list.length} ${list.length === 1 ? 'expense' : 'expenses'} · ${Fmt.moneyR(total)}`;
    const groups = {};
    list.forEach((e) => { (groups[e.date] = groups[e.date] || []).push(e); });
    const dayKeys = Object.keys(groups).sort().reverse();
    const host = document.getElementById('hist-list');
    host.innerHTML = list.length ? dayKeys.map((dk) => `
      <div class="day-group tnum"><span>${Fmt.dayGroupLabel(dk)}</span><span>${Fmt.moneyR(groups[dk].reduce((s, e) => s + e.amount, 0))}</span></div>
      ${groups[dk].map((e) => rowHTML(e, cats)).join('')}
    `).join('') : `<div class="empty"><div class="t">Nothing here</div><div class="d">No expenses match your search.</div></div>`;
    bindRows();
  };

  const bindRows = () => {
    el().querySelectorAll('.hist-row-wrap').forEach((wrap) => {
      const row = wrap.querySelector('[data-row]');
      const id = wrap.getAttribute('data-id');
      let startX = 0, startY = 0, dx = 0, dragging = false, opened = false, decided = false, horiz = false;

      const closeAll = () => { el().querySelectorAll('[data-row]').forEach((r) => { if (r !== row) r.style.transform = ''; }); };

      row.addEventListener('pointerdown', (ev) => {
        startX = ev.clientX; startY = ev.clientY; dx = 0; dragging = true; decided = false; horiz = false;
        row.classList.add('dragging');
      });
      row.addEventListener('pointermove', (ev) => {
        if (!dragging) return;
        const mx = ev.clientX - startX, my = ev.clientY - startY;
        if (!decided) {
          if (Math.abs(mx) > 8 || Math.abs(my) > 8) { decided = true; horiz = Math.abs(mx) > Math.abs(my); if (horiz) { closeAll(); row.setPointerCapture(ev.pointerId); } }
        }
        if (!horiz) return;
        ev.preventDefault();
        const base = opened ? OPEN_X : 0;
        dx = base + mx;
        dx = Math.max(OPEN_X - 24, Math.min(0, dx)); // rubber-band a touch past open
        row.style.transform = `translateX(${dx}px)`;
      });
      const end = () => {
        if (!dragging) return;
        dragging = false; row.classList.remove('dragging');
        if (!horiz) return;
        opened = dx < OPEN_X / 2;
        row.style.transform = opened ? `translateX(${OPEN_X}px)` : '';
      };
      row.addEventListener('pointerup', end);
      row.addEventListener('pointercancel', end);

      row.addEventListener('click', () => {
        if (opened || Math.abs(dx) > 4) { opened = false; row.style.transform = ''; return; }
        openEdit(id);
      });

      wrap.querySelectorAll('[data-a]').forEach((btn) => btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const a = btn.getAttribute('data-a');
        row.style.transform = ''; opened = false;
        if (a === 'edit') openEdit(id);
        else if (a === 'dup') { Store.duplicateExpense(Store.currentMonth, id).then((nid) => { if (nid) App.toast('Duplicated'); }); }
        else if (a === 'del') confirmDelete(id, wrap);
      }));
    });
  };

  const confirmDelete = (id, wrap) => {
    const e = Store.getExpense(Store.currentMonth, id);
    if (!e) return;
    const cats = Store.getCategories();
    App.dialog({
      title: 'Delete this expense?',
      message: `${Fmt.money(e.amount)} · ${e.note || Categories.name(cats, e.category)}. This can’t be undone.`,
      confirm: 'Delete', destructive: true,
      onConfirm: () => {
        wrap.classList.add('removing');
        const snapshot = { amount: e.amount, category: e.category, subcategory: e.subcategory, note: e.note, date: e.date };
        setTimeout(() => Store.deleteExpense(Store.currentMonth, id), 150);
        App.toast('Expense deleted', { undo: () => Store.addExpense(snapshot) });
      },
    });
  };

  const openEdit = (id) => {
    const e = Store.getExpense(Store.currentMonth, id);
    if (!e) return;
    const cats = Store.getCategories();
    const cat = Categories.byId(cats, e.category);
    App.sheet({
      headHTML: `<div class="sheet-head"><span class="sheet-title">${esc(e.note || Categories.name(cats, e.category))}</span><span class="amt tnum">${Fmt.money(e.amount)}</span></div>
        <div class="sheet-meta">${esc(Categories.name(cats, e.category))}${e.subcategory ? ' · ' + esc(e.subcategory) : ''} · ${Fmt.relDay(e.date)}</div>`,
      bodyHTML: `
        <div class="sheet-rows">
          <div class="sheet-row"><span class="k">Amount</span><input id="ed-amount" class="tnum" inputmode="decimal" value="${e.amount}"></div>
          <div class="sheet-row"><span class="k">Category</span>
            <select id="ed-cat">${cats.map((c) => `<option value="${c.id}" ${c.id === e.category ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
          </div>
          <div class="sheet-row" id="ed-sub-row" ${cat && cat.subs.length ? '' : 'hidden'}><span class="k">Subcategory</span>
            <select id="ed-sub"><option value="">—</option>${(cat ? cat.subs : []).map((s) => `<option ${s === e.subcategory ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
          </div>
          <div class="sheet-row"><span class="k">Note</span><input id="ed-note" value="${esc(e.note || '')}" placeholder="—" maxlength="80"></div>
          <div class="sheet-row"><span class="k">Date</span><input id="ed-date" type="date" value="${e.date}"></div>
        </div>
        <div class="sheet-danger" data-a="del">Delete expense</div>`,
      primary: 'Save',
      onMount: (root, close) => {
        const catSel = root.querySelector('#ed-cat');
        catSel.addEventListener('change', () => {
          const c = Categories.byId(cats, catSel.value);
          const subRow = root.querySelector('#ed-sub-row');
          const subSel = root.querySelector('#ed-sub');
          if (c && c.subs.length) { subRow.hidden = false; subSel.innerHTML = '<option value="">—</option>' + c.subs.map((s) => `<option>${esc(s)}</option>`).join(''); }
          else { subRow.hidden = true; }
        });
        root.querySelector('[data-a="del"]').addEventListener('click', () => { close(); confirmDeleteImmediate(id); });
      },
      onPrimary: (root, close) => {
        const amount = parseFloat(root.querySelector('#ed-amount').value) || 0;
        if (amount <= 0) { App.toast('Amount required', { warn: true }); return; }
        const catId = root.querySelector('#ed-cat').value;
        const subSel = root.querySelector('#ed-sub');
        Store.updateExpense(Store.currentMonth, id, {
          amount, category: catId,
          subcategory: subSel && !subSel.parentElement.parentElement.hidden ? subSel.value : null,
          note: root.querySelector('#ed-note').value,
          date: root.querySelector('#ed-date').value,
        });
        close();
        App.toast('Saved');
      },
    });
  };

  const confirmDeleteImmediate = (id) => {
    const e = Store.getExpense(Store.currentMonth, id);
    if (!e) return;
    const snapshot = { amount: e.amount, category: e.category, subcategory: e.subcategory, note: e.note, date: e.date };
    Store.deleteExpense(Store.currentMonth, id);
    App.toast('Expense deleted', { undo: () => Store.addExpense(snapshot) });
  };

  const openRangeSheet = () => {
    const mk = Store.currentMonth;
    App.sheet({
      title: 'Date range',
      bodyHTML: `<div class="sheet-rows">
          <div class="sheet-row"><span class="k">From</span><input id="r-from" type="date" value="${st.range ? st.range.from : mk + '-01'}"></div>
          <div class="sheet-row"><span class="k">To</span><input id="r-to" type="date" value="${st.range ? st.range.to : Fmt.dateKey(new Date())}"></div>
        </div>
        ${st.range ? '<div class="sheet-danger" data-a="clear">Clear range</div>' : ''}`,
      primary: 'Apply',
      onMount: (root, close) => {
        const clr = root.querySelector('[data-a="clear"]');
        if (clr) clr.addEventListener('click', () => { st.range = null; close(); render(); });
      },
      onPrimary: (root, close) => {
        const from = root.querySelector('#r-from').value, to = root.querySelector('#r-to').value;
        if (from && to) st.range = { from: from < to ? from : to, to: from < to ? to : from };
        close(); render();
      },
    });
  };

  const onEnter = () => { render(); };
  return { render, onEnter };
})();
