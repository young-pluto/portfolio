// categories.js — default category tree. Exposed as window.Categories.
// Each category: { id, name, emoji, subs: [string] }.
// Users can edit; custom tree is stored under users/uid/categories.
window.Categories = (() => {
  const DEFAULTS = [
    { id: 'rent',          name: 'Rent',          emoji: '🏠', subs: [] },
    { id: 'fuel',          name: 'Fuel',          emoji: '⛽', subs: ['Bike', 'Car'] },
    { id: 'utilities',     name: 'Utilities',     emoji: '💡', subs: ['Electricity', 'Water', 'Internet', 'Gas'] },
    { id: 'grocery',       name: 'Grocery',       emoji: '🛒', subs: [] },
    { id: 'food',          name: 'Food',          emoji: '🍔', subs: ['Restaurants', 'Cafe', 'Swiggy', 'Zomato'] },
    { id: 'entertainment', name: 'Entertainment', emoji: '🎬', subs: ['Movies', 'Shopping', 'Trips', 'Games'] },
    { id: 'subscriptions', name: 'Subscriptions', emoji: '📱', subs: [] },
    { id: 'health',        name: 'Health',        emoji: '🏥', subs: [] },
    { id: 'transport',     name: 'Transport',     emoji: '🚕', subs: [] },
    { id: 'business',      name: 'Business',      emoji: '💼', subs: [] },
    { id: 'gifts',         name: 'Gifts',         emoji: '🎁', subs: [] },
    { id: 'sports',        name: 'Sports',        emoji: '⚽', subs: ['Turf', 'Equipment', 'Membership'] },
    { id: 'misc',          name: 'Miscellaneous', emoji: '📦', subs: [] },
  ];

  const clone = (arr) => JSON.parse(JSON.stringify(arr));

  const slug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('c' + Math.random().toString(36).slice(2, 7));

  return {
    defaults: () => clone(DEFAULTS),
    slug,
    // find category by id from a given list
    byId: (list, id) => (list || []).find((c) => c.id === id) || null,
    name: (list, id) => { const c = (list || []).find((x) => x.id === id); return c ? c.name : (id || 'Uncategorised'); },
    emoji: (list, id) => { const c = (list || []).find((x) => x.id === id); return c ? c.emoji : '📦'; },
  };
})();

// Pay — payment methods. Fixed, mutually-exclusive set. Exposed as window.Pay.
window.Pay = (() => {
  const METHODS = [
    { id: 'upi',  name: 'UPI',  emoji: '📲' },
    { id: 'card', name: 'Card', emoji: '💳' },
    { id: 'cash', name: 'Cash', emoji: '💵' },
  ];
  const find = (id) => METHODS.find((m) => m.id === id) || null;
  return {
    DEFAULT: 'upi',
    methods: () => METHODS.map((m) => ({ ...m })),
    ids: () => METHODS.map((m) => m.id),
    has: (id) => !!find(id),
    name: (id) => { const m = find(id); return m ? m.name : 'Unmarked'; },
    emoji: (id) => { const m = find(id); return m ? m.emoji : '•'; },
  };
})();
