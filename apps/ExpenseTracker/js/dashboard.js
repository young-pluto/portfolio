// dashboard.js — Home. Answers "How am I doing this month?"
window.Dashboard = (() => {
  const el = () => document.getElementById('screen-dashboard');
  let counted = false; // count-up only on first render of the session

  const initials = () => {
    const p = Store.profile();
    const n = (p && p.name) || (Auth.getUser() && Auth.getUser().email) || 'You';
    return n.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  };

  const paceInfo = (s) => {
    if (!s.budget.monthly || !s.daysElapsed) return { text: '', cls: '' };
    const th = s.budget.monthly * 0.03;
    if (s.utilisation >= 1) return { text: `${Fmt.moneyR(-s.remaining)} over budget`, cls: 'warn' };
    if (s.paceDelta > th) return { text: `${Fmt.moneyR(s.paceDelta)} ahead of pace`, cls: 'warn' };
    if (s.paceDelta < -th) return { text: `${Fmt.moneyR(-s.paceDelta)} under pace`, cls: 'pos' };
    return { text: 'On track', cls: '' };
  };

  const burnBadge = (s) => ({
    'ahead': { t: 'Spending slower than expected', c: 'badge--pos' },
    'on-track': { t: 'On track', c: 'badge--neutral' },
    'overspending': { t: 'Overspending', c: 'badge--warn' },
    'over-budget': { t: 'Over budget', c: 'badge--warn' },
  }[s.burn] || null);

  const headMeta = (s) => {
    const label = Fmt.monthLabel(s.mk);
    if (s.isCurrent) return `${label} · Day ${s.daysElapsed} of ${s.dim}`;
    return label;
  };

  const render = () => {
    const root = el();
    const s = Store.stats(Store.currentMonth);
    const hasBudget = s.budget.monthly > 0;

    // First-run empty state
    if (!hasBudget && s.count === 0) {
      root.innerHTML = `
        <div class="dash-head">
          <button class="month-pill" data-act="month">${headMeta(s)}
            <svg width="8" height="5" viewBox="0 0 8 5"><path d="M1 1l3 3 3-3" stroke="#6E6E74" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>
          </button>
          <button class="avatar" data-act="settings">${initials()}</button>
        </div>
        <div class="empty">
          <div class="t">Nothing logged yet</div>
          <div class="d">Set a monthly budget and add your first expense. It takes five seconds.</div>
          <button class="btn btn--primary" data-act="set-budget">Set budget</button>
          <button class="btn" style="color:var(--text-2)" data-act="goadd">Add an expense</button>
        </div>`;
      wire(root);
      return;
    }

    const pace = paceInfo(s);
    const badge = burnBadge(s);
    const cats = Store.getCategories();
    const top = s.byCategory[0] || null;
    const recent = s.list.slice(0, 4);
    const spentPct = hasBudget ? Math.min(100, s.utilisation * 100) : 0;
    const tickPct = Math.min(100, s.monthPct * 100);

    root.innerHTML = `
      <div class="dash-head">
        <button class="month-pill" data-act="month">${headMeta(s)}
          <svg width="8" height="5" viewBox="0 0 8 5"><path d="M1 1l3 3 3-3" stroke="#6E6E74" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>
        </button>
        <button class="avatar" data-act="settings">${initials()}</button>
      </div>

      <div class="dash-hero">
        <div class="k">${hasBudget ? 'Left to spend' : 'Spent this month'}</div>
        <div class="v tnum" id="dash-hero-val">${Fmt.moneyR(hasBudget ? Math.max(0, s.remaining) : s.spent)}</div>
        ${hasBudget ? `
        <div class="progress ${s.utilisation >= 1 ? 'over' : ''}">
          <div class="fill" style="width:${spentPct}%"></div>
          <div class="tick" style="left:${tickPct}%"></div>
        </div>
        <div class="progress-legend tnum">
          <span class="l">${Fmt.moneyR(s.spent)} of ${Fmt.moneyR(s.budget.monthly)}</span>
          <span class="${pace.cls}">${pace.text}</span>
        </div>` : `
        <div class="progress-legend tnum" style="margin-top:14px">
          <span class="l">${s.count} ${s.count === 1 ? 'expense' : 'expenses'}</span>
          <span class="l">No budget set · <span style="color:var(--accent)" data-act="set-budget">Add one</span></span>
        </div>`}
      </div>

      <div class="stat-strip tnum">
        <div class="stat"><div class="k">${s.isCurrent ? 'Safe today' : 'Daily avg'}</div><div class="v">${Fmt.moneyR(s.isCurrent && hasBudget ? s.safeDaily : s.dailyAvg)}</div></div>
        <div class="stat"><div class="k">Daily avg</div><div class="v">${Fmt.moneyR(s.dailyAvg)}</div></div>
        <div class="stat"><div class="k">${s.isCurrent ? 'Days left' : 'Txns'}</div><div class="v">${s.isCurrent ? s.daysRemaining : s.count}</div></div>
      </div>

      ${top ? `
      <div class="split-row">
        <div class="l"><div class="k">Largest category</div><div class="primary">${Categories.name(cats, top.id)}</div></div>
        <div class="sub"><div class="amt tnum">${Fmt.moneyR(top.total)}</div><div class="meta">${Math.round(top.total / s.spent * 100)}% of spend</div></div>
      </div>` : ''}

      ${badge ? `<div class="wrap" style="padding-top:16px"><span class="badge ${badge.c}">${badge.t}</span>
        ${s.isCurrent && hasBudget ? `<span class="badge badge--neutral" style="margin-left:8px">Projected ${Fmt.moneyR(s.projected)}</span>` : ''}
      </div>` : ''}

      <div class="recent">
        <div class="recent-head"><span class="label">Recent</span>${s.count > 4 ? '<a data-act="gohistory">See all</a>' : ''}</div>
        <div>
          ${recent.length ? recent.map((e) => txnRow(e, cats)).join('') : '<div class="txn"><div class="l"><span class="meta">No expenses yet this month</span></div></div>'}
        </div>
      </div>`;

    // count-up on first render only
    const hv = document.getElementById('dash-hero-val');
    if (hv && !counted) {
      counted = true;
      App.animateValue(hv, hasBudget ? Math.max(0, s.remaining) : s.spent, Fmt.moneyR);
    }
    wire(root);
  };

  const txnRow = (e, cats) => {
    const name = e.note || Categories.name(cats, e.category);
    const bits = [Categories.name(cats, e.category)];
    if (e.subcategory) bits.push(e.subcategory);
    bits.push(Fmt.relDay(e.date));
    return `<div class="txn"><div class="l">
        <span class="name">${esc(name)}</span>
        <span class="meta">${esc(bits.join(' · '))}</span>
      </div><span class="amt tnum">${Fmt.money(e.amount)}</span></div>`;
  };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const wire = (root) => {
    root.querySelectorAll('[data-act]').forEach((n) => {
      n.addEventListener('click', () => {
        const a = n.getAttribute('data-act');
        if (a === 'settings') App.openSettings();
        else if (a === 'month') App.openMonthPicker();
        else if (a === 'goadd') App.goto('add');
        else if (a === 'gohistory') App.goto('history');
        else if (a === 'set-budget') App.openBudgetSheet();
      });
    });
  };

  return { render, resetCount: () => { counted = false; } };
})();
