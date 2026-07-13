// store.js — reactive data layer over Firebase Realtime Database.
// All data lives under users/${uid}/… (same tree convention as Workout Tracker).
// Exposed as window.Store.
window.Store = (() => {
  let uid = null;
  let ref = null;                 // users/${uid}
  const cache = {
    expenses: {},                 // { "YYYY-MM": { id: expense } }
    budgets: { monthly: 0, categories: {}, byMonth: {} },
    categories: null,             // null => use defaults
    recurring: {},                // { id: recurring }
    recurringApplied: {},         // { "YYYY-MM": { recurringId: true } }
    settings: {},
    profile: {},
  };
  let ready = false;
  let currentMonth = Fmt.monthKey(new Date());

  // ---- pub/sub ---------------------------------------------------------
  const subs = new Set();
  const emit = () => { subs.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); };
  const on = (fn) => { subs.add(fn); return () => subs.delete(fn); };

  // ---- init ------------------------------------------------------------
  const listen = (path, key, transform) => new Promise((resolve) => {
    let first = true;
    ref.child(path).on('value', (snap) => {
      cache[key] = transform ? transform(snap.val()) : (snap.val() || {});
      if (first) { first = false; resolve(); }
      else if (ready) emit();
    }, () => { if (first) { first = false; resolve(); } });
  });

  const init = async (userId) => {
    uid = userId;
    ref = database.ref(`users/${uid}`);
    ready = false;
    await Promise.all([
      listen('expenses', 'expenses', (v) => v || {}),
      listen('budgets', 'budgets', (v) => ({ monthly: 0, categories: {}, byMonth: {}, ...(v || {}) })),
      listen('categories', 'categories', (v) => (Array.isArray(v) ? v : null)),
      listen('recurring', 'recurring', (v) => v || {}),
      listen('recurringApplied', 'recurringApplied', (v) => v || {}),
      listen('settings', 'settings', (v) => v || {}),
      listen('profile', 'profile', (v) => v || {}),
    ]);
    ready = true;
    if (cache.settings.currency) Fmt.setSymbol(cache.settings.currency);
    // Auto-post recurring for the current real month if enabled.
    if (cache.settings.autoRecurring) {
      try { await applyRecurring(Fmt.monthKey(new Date())); } catch (e) {}
    }
  };

  const detach = () => { if (ref) ref.off(); ready = false; };

  // ---- categories ------------------------------------------------------
  const getCategories = () => cache.categories || Categories.defaults();
  const setCategories = (arr) => ref.child('categories').set(arr);

  // ---- settings / profile ---------------------------------------------
  const settings = () => cache.settings;
  const profile = () => cache.profile;
  const setSetting = (k, v) => ref.child(`settings/${k}`).set(v);
  const setProfile = (obj) => ref.child('profile').update(obj);

  // ---- budgets ---------------------------------------------------------
  // Resolved budget for a month: per-month override falls back to the default.
  const getBudget = (mk = currentMonth) => {
    const b = cache.budgets || {};
    const override = (b.byMonth && b.byMonth[mk]) || null;
    return {
      monthly: override && override.monthly != null ? override.monthly : (b.monthly || 0),
      categories: (override && override.categories) || b.categories || {},
      isOverride: !!override,
    };
  };
  const setDefaultBudget = (monthly) => ref.child('budgets/monthly').set(Number(monthly) || 0);
  const setCategoryBudget = (catId, amount) => {
    if (!amount) return ref.child(`budgets/categories/${catId}`).remove();
    return ref.child(`budgets/categories/${catId}`).set(Number(amount) || 0);
  };
  const setMonthBudget = (mk, monthly) => ref.child(`budgets/byMonth/${mk}/monthly`).set(Number(monthly) || 0);

  // ---- expenses --------------------------------------------------------
  const monthOf = (dateKey) => dateKey.slice(0, 7);

  const getExpenses = (mk = currentMonth) => {
    const bucket = cache.expenses[mk] || {};
    return Object.keys(bucket)
      .map((id) => ({ id, ...bucket[id] }))
      .sort((a, b) => (b.date === a.date ? (b.createdAt || 0) - (a.createdAt || 0) : (b.date < a.date ? -1 : 1)));
  };

  const getExpense = (mk, id) => {
    const e = (cache.expenses[mk] || {})[id];
    return e ? { id, ...e } : null;
  };

  const allExpenses = () => {
    const out = [];
    Object.keys(cache.expenses).forEach((mk) => {
      const b = cache.expenses[mk] || {};
      Object.keys(b).forEach((id) => out.push({ id, month: mk, ...b[id] }));
    });
    return out;
  };

  const monthsWithData = () => {
    const set = new Set(Object.keys(cache.expenses).filter((mk) => Object.keys(cache.expenses[mk] || {}).length));
    set.add(Fmt.monthKey(new Date()));
    set.add(currentMonth);
    return [...set].sort().reverse();
  };

  const addExpense = (data) => {
    const now = Date.now();
    const date = data.date || Fmt.dateKey(new Date());
    const mk = monthOf(date);
    const rec = {
      amount: Number(data.amount) || 0,
      category: data.category || 'misc',
      subcategory: data.subcategory || null,
      note: (data.note || '').trim() || null,
      date,
      createdAt: now,
      updatedAt: now,
    };
    const id = ref.child(`expenses/${mk}`).push().key;
    return ref.child(`expenses/${mk}/${id}`).set(rec).then(() => id);
  };

  const updateExpense = (oldMonth, id, data) => {
    const existing = getExpense(oldMonth, id) || {};
    const date = data.date || existing.date;
    const newMonth = monthOf(date);
    const rec = {
      amount: Number(data.amount != null ? data.amount : existing.amount) || 0,
      category: data.category || existing.category,
      subcategory: (data.subcategory !== undefined ? data.subcategory : existing.subcategory) || null,
      note: (data.note !== undefined ? (data.note || '').trim() : existing.note) || null,
      date,
      createdAt: existing.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    if (newMonth === oldMonth) {
      return ref.child(`expenses/${newMonth}/${id}`).set(rec);
    }
    // Month changed → move the record.
    return ref.child(`expenses/${oldMonth}/${id}`).remove()
      .then(() => ref.child(`expenses/${newMonth}/${id}`).set(rec));
  };

  const deleteExpense = (mk, id) => ref.child(`expenses/${mk}/${id}`).remove();

  const duplicateExpense = (mk, id) => {
    const e = getExpense(mk, id);
    if (!e) return Promise.resolve(null);
    return addExpense({ amount: e.amount, category: e.category, subcategory: e.subcategory, note: e.note, date: Fmt.dateKey(new Date()) });
  };

  // ---- recurring -------------------------------------------------------
  const recurring = () => Object.keys(cache.recurring).map((id) => ({ id, ...cache.recurring[id] }));
  const addRecurring = (data) => {
    const id = ref.child('recurring').push().key;
    return ref.child(`recurring/${id}`).set({
      name: (data.name || '').trim() || null,
      amount: Number(data.amount) || 0,
      category: data.category || 'misc',
      subcategory: data.subcategory || null,
      dayOfMonth: Math.min(28, Math.max(1, Number(data.dayOfMonth) || 1)),
    }).then(() => id);
  };
  const deleteRecurring = (id) => ref.child(`recurring/${id}`).remove();

  // Create expenses for any recurring item not yet posted this month.
  const applyRecurring = async (mk) => {
    const applied = cache.recurringApplied[mk] || {};
    const list = recurring();
    let created = 0;
    for (const r of list) {
      if (applied[r.id]) continue;
      const day = Fmt.pad2(Math.min(r.dayOfMonth || 1, Fmt.daysInMonth(mk)));
      const date = `${mk}-${day}`;
      await addExpense({ amount: r.amount, category: r.category, subcategory: r.subcategory, note: r.name || null, date });
      await ref.child(`recurringApplied/${mk}/${r.id}`).set(true);
      created++;
    }
    return created;
  };

  // ---- stats -----------------------------------------------------------
  const stats = (mk = currentMonth) => {
    const list = getExpenses(mk);
    const budget = getBudget(mk);
    const now = new Date();
    const realMk = Fmt.monthKey(now);
    const dim = Fmt.daysInMonth(mk);

    let daysElapsed;
    if (mk === realMk) daysElapsed = now.getDate();
    else if (mk < realMk) daysElapsed = dim;              // completed month
    else daysElapsed = 0;                                  // future month
    const daysRemaining = Math.max(0, dim - daysElapsed);
    const isCurrent = mk === realMk;

    const spent = list.reduce((s, e) => s + (e.amount || 0), 0);
    const remaining = budget.monthly - spent;
    const utilisation = budget.monthly > 0 ? spent / budget.monthly : 0;
    const monthPct = daysElapsed / dim;
    const expectedPace = budget.monthly * monthPct;
    const paceDelta = spent - expectedPace;               // >0 => spending faster than the calendar
    const dailyAvg = daysElapsed > 0 ? spent / daysElapsed : 0;
    const safeDaily = daysRemaining > 0 ? Math.max(0, remaining) / daysRemaining : 0;
    const projected = daysElapsed > 0 ? (spent / daysElapsed) * dim : spent;

    // by category
    const catMap = {};
    list.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
    const byCategory = Object.keys(catMap).map((id) => ({ id, total: catMap[id] })).sort((a, b) => b.total - a.total);

    // by day
    const dayMap = {};
    list.forEach((e) => { dayMap[e.date] = (dayMap[e.date] || 0) + e.amount; });
    const days = Object.keys(dayMap).map((d) => ({ date: d, total: dayMap[d] }));
    const highestDay = days.slice().sort((a, b) => b.total - a.total)[0] || null;

    // largest single expense
    const largest = list.slice().sort((a, b) => b.amount - a.amount)[0] || null;

    // weekly buckets (by calendar week of month)
    const weeks = [0, 0, 0, 0, 0];
    list.forEach((e) => {
      const day = Fmt.parseDateKey(e.date).getDate();
      const wi = Math.min(4, Math.floor((day - 1) / 7));
      weeks[wi] += e.amount;
    });

    // burn status
    let burn = 'none';
    if (budget.monthly > 0 && daysElapsed > 0) {
      if (utilisation >= 1) burn = 'over-budget';
      else if (paceDelta > budget.monthly * 0.03) burn = 'overspending';
      else if (paceDelta < -budget.monthly * 0.03) burn = 'ahead';
      else burn = 'on-track';
    }

    return {
      mk, isCurrent, budget, dim, daysElapsed, daysRemaining, monthPct,
      spent, remaining, utilisation, expectedPace, paceDelta,
      dailyAvg, safeDaily, projected,
      count: list.length, byCategory, catMap, byDay: dayMap, days, highestDay, largest, weeks, burn,
      list,
    };
  };

  return {
    init, detach, on,
    get uid() { return uid; },
    get currentMonth() { return currentMonth; },
    setMonth: (mk) => { currentMonth = mk; emit(); },
    getCategories, setCategories,
    settings, profile, setSetting, setProfile,
    getBudget, setDefaultBudget, setCategoryBudget, setMonthBudget,
    getExpenses, getExpense, allExpenses, monthsWithData, monthOf,
    addExpense, updateExpense, deleteExpense, duplicateExpense,
    recurring, addRecurring, deleteRecurring, applyRecurring,
    stats,
  };
})();
