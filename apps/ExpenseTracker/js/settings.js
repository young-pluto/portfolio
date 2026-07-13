// settings.js — budgets, categories, recurring, export, account.
window.Settings = (() => {
  const el = () => document.getElementById('screen-settings');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const chev = `<svg class="chev" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="#6E6E74" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const render = () => {
    const b = Store.getBudget(Store.currentMonth);
    const set = Store.settings();
    const cats = Store.getCategories();
    const catBudgetCount = Object.keys(b.categories || {}).filter((k) => b.categories[k]).length;
    const p = Store.profile();

    el().innerHTML = `
      <div class="set-back" style="padding-top:calc(var(--sat) + 8px)">
        <button class="icon-btn" style="background:none;width:auto;height:auto;color:var(--text-2)" data-act="back">
          <svg width="11" height="18" viewBox="0 0 11 18" fill="none"><path d="M9.5 1.5L2 9l7.5 7.5" stroke="#9A9AA1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="scr-title">Settings</div>
      </div>

      <div class="set-body">
        <span class="label group-label">Budget</span>
        <div class="group">
          <div class="grow"><span>Monthly budget</span><input class="inline" id="set-monthly" inputmode="numeric" value="${b.monthly || ''}" placeholder="Not set"></div>
          <div class="grow tap" data-act="catbudgets"><span>Category budgets</span><div class="r"><span>${catBudgetCount || 'None'}</span>${chev}</div></div>
        </div>

        <span class="label group-label">Categories</span>
        <div class="group">
          <div class="grow tap" data-act="cats"><span>Manage categories</span><div class="r"><span>${cats.length}</span>${chev}</div></div>
        </div>

        <span class="label group-label">Recurring</span>
        <div class="group">
          <div class="grow tap" data-act="recurring"><span>Recurring expenses</span><div class="r"><span>${Store.recurring().length}</span>${chev}</div></div>
          <div class="grow"><span>Auto-post each month</span><div class="toggle ${set.autoRecurring ? 'on' : ''}" data-act="toggle-auto"><i></i></div></div>
        </div>

        <span class="label group-label">General</span>
        <div class="group">
          <div class="grow"><span>Currency</span><span class="r">${Fmt.symbol} INR</span></div>
          <div class="grow"><span>Name</span><input class="inline" id="set-name" value="${esc(p.name || '')}" placeholder="You" style="width:160px"></div>
        </div>

        <span class="label group-label">Data</span>
        <div class="group">
          <div class="grow tap" data-act="export-csv"><span>Export as CSV</span>${chev}</div>
          <div class="grow tap" data-act="export-xls"><span>Export as Excel</span>${chev}</div>
          <div class="grow tap destructive" data-act="erase"><span>Erase all data</span></div>
        </div>

        <div class="group" style="margin-top:22px">
          <div class="grow tap destructive" data-act="logout" style="justify-content:center"><span>Log out</span></div>
        </div>

        <div class="set-foot">Ledger 1.0 · Synced to your account</div>
      </div>`;
    wire();
  };

  const wire = () => {
    const q = (a) => el().querySelector(`[data-act="${a}"]`);
    q('back').addEventListener('click', () => App.closeSettings());

    const monthly = el().querySelector('#set-monthly');
    monthly.addEventListener('change', () => Store.setDefaultBudget(parseFloat(monthly.value) || 0));

    const name = el().querySelector('#set-name');
    name.addEventListener('change', () => Store.setProfile({ name: name.value.trim() || null }));

    q('catbudgets').addEventListener('click', openCategoryBudgets);
    q('cats').addEventListener('click', openManageCategories);
    q('recurring').addEventListener('click', openRecurring);
    q('toggle-auto').addEventListener('click', () => { Store.setSetting('autoRecurring', !Store.settings().autoRecurring); });
    q('export-csv').addEventListener('click', () => exportData('csv'));
    q('export-xls').addEventListener('click', () => exportData('xls'));
    q('erase').addEventListener('click', confirmErase);
    q('logout').addEventListener('click', () => Auth.logout());
  };

  // ---- category budgets -------------------------------------------------
  const openCategoryBudgets = () => {
    const cats = Store.getCategories();
    const b = Store.getBudget(Store.currentMonth);
    App.sheet({
      title: 'Category budgets',
      bodyHTML: `<div class="sheet-rows">
        ${cats.map((c) => `<div class="sheet-row"><span class="k">${c.emoji} ${esc(c.name)}</span>
          <input data-cat="${c.id}" class="tnum" inputmode="numeric" placeholder="—" value="${b.categories[c.id] || ''}" style="width:110px"></div>`).join('')}
      </div>`,
      primary: 'Done',
      onPrimary: (root, close) => {
        root.querySelectorAll('[data-cat]').forEach((inp) => {
          const v = parseFloat(inp.value) || 0;
          Store.setCategoryBudget(inp.getAttribute('data-cat'), v);
        });
        close(); App.toast('Category budgets saved');
      },
    });
  };

  // ---- manage categories ------------------------------------------------
  const openManageCategories = () => {
    const cats = Store.getCategories();
    App.sheet({
      title: 'Categories',
      bodyHTML: `
        <div id="cat-list">${cats.map(catRow).join('')}</div>
        <button class="btn btn--secondary btn--block" id="add-cat" style="margin-top:14px">Add category</button>`,
      onMount: (root, close) => bindCats(root),
    });
  };

  const catRow = (c) => `<div class="edit-row" data-id="${c.id}">
      <span class="emoji">${c.emoji}</span>
      <div style="flex:1;min-width:0"><div class="nm">${esc(c.name)}</div>${c.subs && c.subs.length ? `<div class="sub">${esc(c.subs.join(' · '))}</div>` : ''}</div>
      <button class="rm" data-a="subs" style="color:var(--text-2);font-size:14px;padding:6px 8px">Edit</button>
      <button class="rm" data-a="rm">×</button>
    </div>`;

  const bindCats = (root) => {
    const cats = Store.getCategories();
    root.querySelector('#add-cat').addEventListener('click', () => {
      App.prompt({ title: 'New category', placeholder: 'Name', fields: [{ id: 'emoji', placeholder: 'Emoji', value: '📦', width: '64px' }, { id: 'name', placeholder: 'Name' }] }, (vals) => {
        if (!vals.name) return;
        const list = Store.getCategories();
        list.push({ id: Categories.slug(vals.name), name: vals.name, emoji: vals.emoji || '📦', subs: [] });
        Store.setCategories(list); App.toast('Category added'); App.closeSheet(); openManageCategories();
      });
    });
    root.querySelectorAll('.edit-row').forEach((r) => {
      const id = r.getAttribute('data-id');
      r.querySelector('[data-a="rm"]').addEventListener('click', () => {
        App.dialog({ title: 'Remove category?', message: 'Existing expenses keep their label.', confirm: 'Remove', destructive: true, onConfirm: () => {
          Store.setCategories(Store.getCategories().filter((c) => c.id !== id)); App.closeSheet(); openManageCategories();
        }});
      });
      r.querySelector('[data-a="subs"]').addEventListener('click', () => editSubs(id));
    });
  };

  const editSubs = (id) => {
    const cats = Store.getCategories();
    const c = Categories.byId(cats, id);
    App.sheet({
      title: `${c.emoji} ${c.name}`,
      bodyHTML: `
        <div class="sheet-rows"><div class="sheet-row"><span class="k">Name</span><input id="c-name" value="${esc(c.name)}"></div>
        <div class="sheet-row"><span class="k">Emoji</span><input id="c-emoji" value="${esc(c.emoji)}" style="width:80px"></div></div>
        <div class="label group-label" style="margin-top:16px">Subcategories</div>
        <div id="sub-list">${(c.subs || []).map((s) => `<div class="edit-row" data-s="${esc(s)}"><div class="nm">${esc(s)}</div><button class="rm" data-a="rm">×</button></div>`).join('') || '<div class="sub" style="padding:8px 0;color:var(--text-3)">None yet</div>'}</div>
        <button class="btn btn--secondary btn--block" id="add-sub" style="margin-top:12px">Add subcategory</button>`,
      primary: 'Save',
      onMount: (root) => {
        root.querySelector('#add-sub').addEventListener('click', () => {
          App.prompt({ title: 'New subcategory', fields: [{ id: 'name', placeholder: 'Name' }] }, (vals) => {
            if (!vals.name) return;
            const list = Store.getCategories(); const cc = Categories.byId(list, id);
            cc.subs = cc.subs || []; cc.subs.push(vals.name); Store.setCategories(list); App.closeSheet(); editSubs(id);
          });
        });
        root.querySelectorAll('#sub-list [data-a="rm"]').forEach((btn) => btn.addEventListener('click', () => {
          const s = btn.closest('[data-s]').getAttribute('data-s');
          const list = Store.getCategories(); const cc = Categories.byId(list, id);
          cc.subs = (cc.subs || []).filter((x) => x !== s); Store.setCategories(list); App.closeSheet(); editSubs(id);
        }));
      },
      onPrimary: (root, close) => {
        const list = Store.getCategories(); const cc = Categories.byId(list, id);
        cc.name = root.querySelector('#c-name').value.trim() || cc.name;
        cc.emoji = root.querySelector('#c-emoji').value.trim() || cc.emoji;
        Store.setCategories(list); close(); App.toast('Saved');
      },
    });
  };

  // ---- recurring --------------------------------------------------------
  const openRecurring = () => {
    const cats = Store.getCategories();
    const list = Store.recurring();
    App.sheet({
      title: 'Recurring expenses',
      bodyHTML: `
        <div id="rec-list">${list.length ? list.map((r) => `<div class="edit-row" data-id="${r.id}">
            <div style="flex:1"><div class="nm">${esc(r.name || Categories.name(cats, r.category))}</div>
              <div class="sub tnum">${Fmt.money(r.amount)} · ${esc(Categories.name(cats, r.category))} · day ${r.dayOfMonth}</div></div>
            <button class="rm" data-a="post" style="color:var(--accent);font-size:13px;padding:6px 8px">Post</button>
            <button class="rm" data-a="rm">×</button></div>`).join('')
          : '<div class="sub" style="padding:8px 0;color:var(--text-3)">None yet. Add Netflix, Rent, Gym…</div>'}</div>
        <button class="btn btn--secondary btn--block" id="add-rec" style="margin-top:14px">Add recurring</button>`,
      onMount: (root) => {
        root.querySelector('#add-rec').addEventListener('click', addRecurring);
        root.querySelectorAll('.edit-row').forEach((r) => {
          const id = r.getAttribute('data-id');
          r.querySelector('[data-a="rm"]').addEventListener('click', () => { Store.deleteRecurring(id); App.closeSheet(); openRecurring(); });
          r.querySelector('[data-a="post"]').addEventListener('click', () => {
            const rec = Store.recurring().find((x) => x.id === id);
            if (rec) { Store.addExpense({ amount: rec.amount, category: rec.category, subcategory: rec.subcategory, note: rec.name, date: Fmt.dateKey(new Date()) }); App.toast(`Posted ${Fmt.money(rec.amount)}`); }
          });
        });
      },
    });
  };

  const addRecurring = () => {
    const cats = Store.getCategories();
    App.sheet({
      title: 'New recurring expense',
      bodyHTML: `<div class="sheet-rows">
          <div class="sheet-row"><span class="k">Name</span><input id="r-name" placeholder="Netflix"></div>
          <div class="sheet-row"><span class="k">Amount</span><input id="r-amt" class="tnum" inputmode="numeric" placeholder="0"></div>
          <div class="sheet-row"><span class="k">Category</span><select id="r-cat">${cats.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
          <div class="sheet-row"><span class="k">Day of month</span><input id="r-day" class="tnum" inputmode="numeric" placeholder="1" value="1"></div>
        </div>`,
      primary: 'Add',
      onPrimary: (root, close) => {
        const amt = parseFloat(root.querySelector('#r-amt').value) || 0;
        if (amt <= 0) { App.toast('Amount required', { warn: true }); return; }
        Store.addRecurring({
          name: root.querySelector('#r-name').value, amount: amt,
          category: root.querySelector('#r-cat').value,
          dayOfMonth: parseInt(root.querySelector('#r-day').value, 10) || 1,
        });
        close(); App.toast('Recurring added'); openRecurring();
      },
    });
  };

  // ---- export -----------------------------------------------------------
  const exportData = (kind) => {
    const cats = Store.getCategories();
    const rows = Store.allExpenses().sort((a, b) => (a.date < b.date ? 1 : -1));
    const header = ['Date', 'Category', 'Subcategory', 'Note', 'Amount'];
    if (kind === 'csv') {
      const csvEsc = (v) => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      const lines = [header.join(',')].concat(rows.map((e) =>
        [e.date, Categories.name(cats, e.category), e.subcategory || '', e.note || '', e.amount].map(csvEsc).join(',')));
      download('ledger-expenses.csv', 'text/csv;charset=utf-8', '﻿' + lines.join('\n'));
    } else {
      // Excel-openable HTML table (.xls)
      const cell = (v) => `<td>${esc(v == null ? '' : v)}</td>`;
      const body = rows.map((e) => `<tr>${cell(e.date)}${cell(Categories.name(cats, e.category))}${cell(e.subcategory)}${cell(e.note)}<td>${e.amount}</td></tr>`).join('');
      const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><tr>${header.map((h) => `<th>${h}</th>`).join('')}</tr>${body}</table></body></html>`;
      download('ledger-expenses.xls', 'application/vnd.ms-excel', html);
    }
    App.toast(`Exported ${rows.length} expenses`);
  };

  const download = (name, type, content) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  };

  const confirmErase = () => {
    App.dialog({
      title: 'Erase all data?',
      message: 'Every expense, budget and recurring item will be permanently deleted. Your account stays.',
      confirm: 'Erase', destructive: true,
      onConfirm: () => {
        const ref = database.ref(`users/${Store.uid}`);
        Promise.all(['expenses', 'budgets', 'recurring', 'recurringApplied'].map((k) => ref.child(k).remove()))
          .then(() => App.toast('All data erased'));
      },
    });
  };

  const onEnter = () => render();
  return { render, onEnter };
})();
