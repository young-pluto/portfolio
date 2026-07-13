// insights.js — editorial: one sentence, one chart, one caption per section.
window.Insights = (() => {
  const el = () => document.getElementById('screen-insights');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const BAR_MAX_PX = 120; // px height for a full-height bar (chart body)
  const barPx = (pct) => Math.max(2, pct / 100 * BAR_MAX_PX);

  const monthTotal = (mk) => Store.getExpenses(mk).reduce((s, e) => s + e.amount, 0);
  const prevMonthKey = (mk, back = 1) => { const d = Fmt.parseMonthKey(mk); d.setMonth(d.getMonth() - back); return Fmt.monthKey(d); };
  const spendToDate = (mk, day) => Store.getExpenses(mk).filter((e) => Fmt.parseDateKey(e.date).getDate() <= day).reduce((s, e) => s + e.amount, 0);

  const lastMonths = (mk, n) => { const out = []; for (let i = n - 1; i >= 0; i--) out.push(prevMonthKey(mk, i)); return out; };

  const render = () => {
    const mk = Store.currentMonth;
    const s = Store.stats(mk);
    const cats = Store.getCategories();

    if (s.count === 0) {
      el().innerHTML = `
        <div class="scr-head"><div class="scr-title">Insights</div>
          <button class="month-pill" data-act="month">${Fmt.monthShort(mk)}
            <svg width="8" height="5" viewBox="0 0 8 5"><path d="M1 1l3 3 3-3" stroke="#6E6E74" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg></button></div>
        <div class="empty"><div class="t">No insights yet</div><div class="d">Log a few expenses and this fills with trends, comparisons and observations.</div></div>`;
      wireHead(); return;
    }

    el().innerHTML = `
      <div class="scr-head"><div class="scr-title">Insights</div>
        <button class="month-pill" data-act="month">${Fmt.monthShort(mk)}
          <svg width="8" height="5" viewBox="0 0 8 5"><path d="M1 1l3 3 3-3" stroke="#6E6E74" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg></button></div>
      <div class="ins-body">
        ${sectionMoM(mk, s)}
        ${sectionProjection(mk, s)}
        ${sectionTopCats(mk, s, cats)}
        ${sectionDonut(s, cats)}
        ${sectionWeekly(s)}
        ${sectionCalendar(mk, s)}
        ${sectionSmart(mk, s, cats)}
      </div>`;
    wireHead();
    requestAnimationFrame(() => animate());
  };

  // 1 · month over month --------------------------------------------------
  const sectionMoM = (mk, s) => {
    const months = lastMonths(mk, 6);
    const totals = months.map(monthTotal);
    const max = Math.max(...totals, 1);
    const prev = prevMonthKey(mk);
    const curToDate = spendToDate(mk, s.daysElapsed || s.dim);
    const prevToDate = spendToDate(prev, s.daysElapsed || s.dim);
    let headline, caption;
    if (prevToDate > 0) {
      const pct = Math.round((curToDate - prevToDate) / prevToDate * 100);
      const dir = pct <= 0 ? 'less' : 'more';
      headline = `You’ve spent <span class="${pct <= 0 ? 'pos' : ''}">${Math.abs(pct)}% ${dir}</span> than this time last month.`;
      caption = `${Fmt.moneyR(curToDate)} so far · ${Fmt.moneyR(prevToDate)} by this date in ${Fmt.monthShort(prev)}`;
    } else {
      headline = `You’ve spent ${Fmt.moneyR(curToDate)} so far this month.`;
      caption = `Not enough history yet to compare with ${Fmt.monthShort(prev)}.`;
    }
    return `<div class="ins-section">
      <div class="ins-headline">${headline}</div>
      <div class="bars">
        ${months.map((m, i) => { const h = Math.max(3, totals[i] / max * 100); return `<div class="bar-col ${m === mk ? 'current' : ''}">
          <div class="bar ${m === mk ? 'accent' : ''}" data-h="${h}" style="min-height:${barPx(h)}px"></div>
          <div class="bar-lab">${Fmt.monthShort(m)}</div></div>`; }).join('')}
      </div>
      <div class="ins-caption tnum">${caption}</div></div>`;
  };

  // 2 · projection --------------------------------------------------------
  const sectionProjection = (mk, s) => {
    if (!s.budget.monthly) return '';
    const diff = s.budget.monthly - s.projected;
    const under = diff >= 0;
    const headline = `At this pace you’ll finish the month <span class="${under ? 'pos' : 'warn'}">${Fmt.moneyR(Math.abs(diff))} ${under ? 'under' : 'over'} budget.</span>`;
    // build polylines
    const W = 350, H = 96;
    const days = s.dim, todayD = Math.max(1, s.daysElapsed);
    // cumulative actual to date
    let cum = 0; const pts = [];
    for (let d = 1; d <= todayD; d++) {
      cum += (s.byDay[`${mk}-${Fmt.pad2(d)}`] || 0);
      pts.push([(d - 1) / (days - 1) * W, H - Math.min(1, cum / Math.max(s.budget.monthly, s.projected, 1)) * (H - 8)]);
    }
    const todayPt = pts[pts.length - 1] || [0, H];
    // projected dashed line from today to end
    const endY = H - Math.min(1, s.projected / Math.max(s.budget.monthly, s.projected, 1)) * (H - 8);
    const actual = pts.map((p) => p.join(',')).join(' ');
    const budgetY = H - Math.min(1, s.budget.monthly / Math.max(s.budget.monthly, s.projected, 1)) * (H - 8);
    return `<div class="ins-section">
      <div class="ins-headline">${headline}</div>
      <svg class="proj" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <line x1="0" y1="${budgetY}" x2="${W}" y2="${budgetY}" stroke="rgba(255,255,255,0.14)" stroke-width="1" stroke-dasharray="3 4"/>
        <polyline points="${todayPt.join(',')} ${W},${endY}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-dasharray="2 4"/>
        <polyline points="${actual}" fill="none" stroke="#8FAFD8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${todayPt[0]}" cy="${todayPt[1]}" r="3.5" fill="#8FAFD8"/>
      </svg>
      <div class="proj-axis"><span>1 ${Fmt.monthShort(mk)}</span><span>Today</span><span>${s.dim} ${Fmt.monthShort(mk)}</span></div></div>`;
  };

  // 3 · top categories (with change vs last month) ------------------------
  const sectionTopCats = (mk, s, cats) => {
    if (!s.byCategory.length) return '';
    const prev = prevMonthKey(mk);
    const prevStats = Store.stats(prev);
    const max = s.byCategory[0].total || 1;
    const top = s.byCategory.slice(0, 6);
    // find biggest mover for the headline
    let mover = null;
    s.byCategory.forEach((c) => {
      const was = prevStats.catMap[c.id] || 0;
      const delta = c.total - was;
      if (!mover || Math.abs(delta) > Math.abs(mover.delta)) mover = { id: c.id, delta, total: c.total };
    });
    let headline = `${esc(Categories.name(cats, s.byCategory[0].id))} is your largest expense this month.`;
    if (mover && Math.abs(mover.delta) > 100) {
      headline = `${esc(Categories.name(cats, mover.id))} ${mover.delta > 0 ? 'increased' : 'decreased'} by <span class="${mover.delta > 0 ? '' : 'pos'}">${Fmt.moneyR(Math.abs(mover.delta))}</span>.`;
    }
    return `<div class="ins-section">
      <div class="ins-headline">${headline}</div>
      <div class="rank">
        ${top.map((c) => {
          const hot = mover && c.id === mover.id;
          const change = (prevStats.catMap[c.id] || 0);
          const delta = c.total - change;
          const chLabel = Math.abs(delta) > 100 ? ` · ${delta > 0 ? '+' : '−'}${Fmt.moneyR(Math.abs(delta))} vs ${Fmt.monthShort(prev)}` : '';
          return `<div class="rank-item ${hot ? 'hot' : ''}">
            <div class="rank-top"><span class="n">${esc(Categories.name(cats, c.id))}${chLabel}</span><span class="a tnum">${Fmt.moneyR(c.total)}</span></div>
            <div class="rank-track"><div class="rank-fill" data-w="${c.total / max * 100}"></div></div></div>`;
        }).join('')}
      </div></div>`;
  };

  // 4 · category donut ----------------------------------------------------
  const sectionDonut = (s, cats) => {
    if (!s.byCategory.length) return '';
    const total = s.spent || 1;
    const top = s.byCategory.slice(0, 6);
    const otherTotal = s.byCategory.slice(6).reduce((a, c) => a + c.total, 0);
    const slices = top.map((c) => ({ name: Categories.name(cats, c.id), val: c.total }));
    if (otherTotal > 0) slices.push({ name: 'Other', val: otherTotal });
    const ramp = ['#8FAFD8', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.42)', 'rgba(255,255,255,0.32)', 'rgba(255,255,255,0.24)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.10)'];
    const R = 42, C = 2 * Math.PI * R;
    let off = 0;
    const rings = slices.map((sl, i) => {
      const frac = sl.val / total;
      const seg = `<circle cx="56" cy="56" r="${R}" fill="none" stroke="${ramp[i] || ramp[ramp.length - 1]}" stroke-width="14"
        stroke-dasharray="${(frac * C).toFixed(2)} ${(C).toFixed(2)}" stroke-dashoffset="${(-off * C).toFixed(2)}" transform="rotate(-90 56 56)"/>`;
      off += frac; return seg;
    }).join('');
    return `<div class="ins-section">
      <div class="ins-headline">Where it went.</div>
      <div class="donut-wrap">
        <svg class="donut" width="112" height="112" viewBox="0 0 112 112">${rings}
          <text x="56" y="52" text-anchor="middle" fill="#F2F2F4" font-size="15" font-weight="600" font-family="-apple-system,system-ui">${slices.length}</text>
          <text x="56" y="68" text-anchor="middle" fill="#6E6E74" font-size="10" font-family="-apple-system,system-ui">categories</text>
        </svg>
        <div class="donut-legend">
          ${slices.map((sl, i) => `<div class="li"><span class="dot" style="background:${ramp[i] || ramp[ramp.length - 1]}"></span><span class="nm">${esc(sl.name)}</span><span class="pct tnum">${Math.round(sl.val / total * 100)}%</span></div>`).join('')}
        </div></div></div>`;
  };

  // 5 · weekly ------------------------------------------------------------
  const sectionWeekly = (s) => {
    const weeks = s.weeks.filter((_, i) => i < Math.ceil(s.dim / 7));
    const max = Math.max(...weeks, 1);
    return `<div class="ins-section">
      <div class="ins-headline">Spending by week.</div>
      <div class="bars">
        ${weeks.map((w, i) => { const h = Math.max(3, w / max * 100); return `<div class="bar-col"><div class="bar" data-h="${h}" style="min-height:${barPx(h)}px"></div><div class="bar-lab">W${i + 1}</div></div>`; }).join('')}
      </div>
      <div class="ins-caption tnum">Highest week · ${Fmt.moneyR(max)}</div></div>`;
  };

  // 6 · calendar heatmap --------------------------------------------------
  const sectionCalendar = (mk, s) => {
    const dim = s.dim;
    const first = Fmt.parseMonthKey(mk).getDay(); // 0=Sun
    const dayVals = [];
    let maxDay = 1;
    for (let d = 1; d <= dim; d++) { const v = s.byDay[`${mk}-${Fmt.pad2(d)}`] || 0; dayVals.push(v); if (v > maxDay) maxDay = v; }
    const dow = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const cells = [];
    for (let i = 0; i < first; i++) cells.push('<div></div>');
    for (let d = 1; d <= dim; d++) {
      const v = dayVals[d - 1];
      const intensity = v > 0 ? 0.12 + (v / maxDay) * 0.78 : 0;
      const bg = v > 0 ? `rgba(143,175,216,${intensity.toFixed(2)})` : 'var(--wash)';
      cells.push(`<div class="cal-cell" style="background:${bg}" title="${Fmt.moneyR(v)}"></div>`);
    }
    const hi = s.highestDay;
    return `<div class="ins-section">
      <div class="ins-headline">Your expensive days.</div>
      <div class="cal" style="margin-bottom:6px">${dow.map((d) => `<div class="cal-dow">${d}</div>`).join('')}</div>
      <div class="cal">${cells.join('')}</div>
      ${hi ? `<div class="ins-caption tnum">Highest · ${Fmt.relDay(hi.date)}, ${Fmt.moneyR(hi.total)}</div>` : ''}</div>`;
  };

  // 7 · smart insights ----------------------------------------------------
  const sectionSmart = (mk, s, cats) => {
    const prev = prevMonthKey(mk);
    const prevStats = Store.stats(prev);
    const cards = [];
    // largest category share
    if (s.byCategory[0]) {
      const c = s.byCategory[0];
      cards.push(`<b>${esc(Categories.name(cats, c.id))}</b> is your largest expense this month at <b>${Math.round(c.total / s.spent * 100)}%</b> of spend.`);
    }
    // subscriptions share
    const subs = s.catMap['subscriptions'];
    if (subs) cards.push(`Subscriptions account for <b>${Math.round(subs / s.spent * 100)}%</b> of total expenses.`);
    // biggest % change vs last month per category
    let best = null;
    s.byCategory.forEach((c) => {
      const was = prevStats.catMap[c.id] || 0;
      if (was > 200) { const pct = Math.round((c.total - was) / was * 100); if (!best || Math.abs(pct) > Math.abs(best.pct)) best = { id: c.id, pct }; }
    });
    if (best && Math.abs(best.pct) >= 5) {
      cards.push(`You’ve spent <b>${Math.abs(best.pct)}% ${best.pct > 0 ? 'more' : 'less'}</b> on ${esc(Categories.name(cats, best.id))} than last month.`);
    }
    // pace
    if (s.budget.monthly && s.isCurrent) {
      if (s.paceDelta < 0) cards.push(`You’re spending <b>slower</b> than your budget’s pace — <b>${Fmt.moneyR(-s.paceDelta)}</b> under where you’d expect by today.`);
      else if (s.paceDelta > s.budget.monthly * 0.03) cards.push(`You’re <b>${Fmt.moneyR(s.paceDelta)}</b> ahead of your budget’s pace for today.`);
    }
    if (!cards.length) return '';
    return `<div class="ins-section">
      <div class="ins-headline">Worth noting.</div>
      <div class="smart">${cards.slice(0, 4).map((c) => `<div class="smart-card">${c}</div>`).join('')}</div></div>`;
  };

  const animate = () => {
    // Bars already have their correct min-height baked into the markup; animate
    // the grow-in from the baseline for the first paint.
    el().querySelectorAll('.bar[data-h]').forEach((b, i) => {
      const target = barPx(parseFloat(b.getAttribute('data-h')));
      b.style.minHeight = '2px';
      setTimeout(() => { b.style.minHeight = target + 'px'; }, 30 * i);
    });
    el().querySelectorAll('.rank-fill[data-w]').forEach((f, i) => { f.style.width = '0%'; setTimeout(() => { f.style.width = f.getAttribute('data-w') + '%'; }, 40 * i); });
  };

  const wireHead = () => {
    const mp = el().querySelector('[data-act="month"]');
    if (mp) mp.addEventListener('click', App.openMonthPicker);
  };

  const onEnter = () => render();
  return { render, onEnter };
})();
