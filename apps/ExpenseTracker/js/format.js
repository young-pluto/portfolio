// format.js — currency, date & number helpers. Exposed as window.Fmt.
window.Fmt = (() => {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Currency symbol is fixed to INR per spec, but kept configurable.
  let symbol = '₹';
  const setSymbol = (s) => { symbol = s; };

  // ₹1,23,456 — Indian grouping.
  const inGroup = (n) => {
    const s = Math.round(Math.abs(n)).toString();
    if (s.length <= 3) return s;
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  };

  // Money with symbol, no decimals unless fractional.
  const money = (n) => {
    n = Number(n) || 0;
    const neg = n < 0;
    let body = inGroup(n);
    const frac = Math.abs(n) % 1;
    if (frac > 0.001) {
      body = inGroup(Math.floor(Math.abs(n))) + '.' + Math.round(frac * 100).toString().padStart(2, '0');
    }
    return (neg ? '−' : '') + symbol + body;
  };

  // rounded to whole rupees — for derived/aggregate figures (pace, averages, totals)
  const moneyR = (n) => money(Math.round(Number(n) || 0));

  // compact: ₹9.8k / ₹1.2L
  const moneyCompact = (n) => {
    n = Number(n) || 0;
    const a = Math.abs(n);
    if (a >= 10000000) return symbol + (n / 10000000).toFixed(a % 10000000 ? 1 : 0) + 'Cr';
    if (a >= 100000) return symbol + (n / 100000).toFixed(a % 100000 ? 1 : 0) + 'L';
    if (a >= 1000) return symbol + (n / 1000).toFixed(a % 1000 ? 1 : 0) + 'k';
    return symbol + Math.round(n);
  };

  const pad2 = (n) => String(n).padStart(2, '0');

  // month key "YYYY-MM"
  const monthKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const parseDateKey = (s) => { const [y,m,dd] = s.split('-').map(Number); return new Date(y, m-1, dd); };
  const parseMonthKey = (s) => { const [y,m] = s.split('-').map(Number); return new Date(y, m-1, 1); };

  const monthLabel = (key) => { const d = parseMonthKey(key); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const monthShort = (key) => { const d = parseMonthKey(key); return MONTHS_SHORT[d.getMonth()]; };

  const daysInMonth = (key) => { const d = parseMonthKey(key); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); };

  // Relative day label used in lists.
  const relDay = (dk, today = new Date()) => {
    const d = parseDateKey(dk);
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.round((t0 - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  };
  const dayGroupLabel = (dk, today = new Date()) => {
    const d = parseDateKey(dk);
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.round((t0 - d) / 86400000);
    const base = `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
    if (diff === 0) return `Today · ${base}`;
    if (diff === 1) return `Yesterday · ${base}`;
    return base;
  };

  const timeLabel = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    let h = d.getHours(); const m = pad2(d.getMinutes());
    const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return `${h}:${m} ${ap}`;
  };

  return {
    setSymbol, get symbol() { return symbol; },
    money, moneyR, moneyCompact, inGroup,
    monthKey, dateKey, parseDateKey, parseMonthKey, monthLabel, monthShort, monthLong: (k)=>monthLabel(k),
    daysInMonth, relDay, dayGroupLabel, timeLabel, pad2,
    MONTHS, MONTHS_SHORT, DAYS_SHORT
  };
})();
