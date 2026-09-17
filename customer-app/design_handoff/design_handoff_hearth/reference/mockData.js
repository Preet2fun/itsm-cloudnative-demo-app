// Hearth mock fixtures — one tenant, three locations.
// Single source of truth for every reference screen. No network, nothing persisted.

export const BRAND = 'Hearth';

export const tenant = { id: 'ten_northside', name: 'Northside Hospitality' };

export const admin = {
  id: 'usr_rosa',
  name: 'Rosa Medina',
  initials: 'RM',
  email: 'rosa@northsidehospitality.com',
  role: 'admin'
};

export const restaurants = [
  { id: 'rst_trattoria', name: 'Northside Trattoria', address: '412 Linden Ave', status: 'open' },
  { id: 'rst_harbour',   name: 'Harbourline Kitchen', address: '9 Wharf Road',    status: 'open' },
  { id: 'rst_eastgate',  name: 'Eastgate Counter',    address: '77 Eastgate Mall', status: 'closed' }
];

export const menuItems = [
  { id: 'itm_marg', restaurantId: 'rst_trattoria', name: 'Margherita', description: 'San Marzano, fior di latte, basil', price: 14.00, category: 'Pizza', available: true },
  { id: 'itm_calz', restaurantId: 'rst_trattoria', name: 'Calzone', description: 'Ricotta, salami, oregano', price: 16.50, category: 'Pizza', available: true },
  { id: 'itm_carb', restaurantId: 'rst_trattoria', name: 'Carbonara', description: 'Guanciale, pecorino, black pepper', price: 19.00, category: 'Pasta', available: true },
  { id: 'itm_lasa', restaurantId: 'rst_trattoria', name: 'Lasagne', description: 'Beef ragù, béchamel, 24h bake', price: 19.00, category: 'Pasta', available: true },
  { id: 'itm_knot', restaurantId: 'rst_trattoria', name: 'Garlic knots', description: 'Six per order, confit garlic butter', price: 6.20, category: 'Sides', available: true },
  { id: 'itm_focc', restaurantId: 'rst_trattoria', name: 'Focaccia board', description: 'Rosemary focaccia, olives, whipped ricotta', price: 18.00, category: 'Sides', available: false },
  { id: 'itm_tira', restaurantId: 'rst_trattoria', name: 'Tiramisu', description: 'Made each morning', price: 9.00, category: 'Dessert', available: true },
  { id: 'itm_red',  restaurantId: 'rst_trattoria', name: 'House red', description: 'Montepulciano, by the glass', price: 11.00, category: 'Drinks', available: true }
];

// minutesAgo keeps relative timestamps honest across reloads.
const now = Date.now();
const minutesAgo = m => new Date(now - m * 60000).toISOString();

export const orders = [
  { id: 'ORD-4821', restaurantId: 'rst_trattoria', status: 'preparing', total: 34.20, placedAt: minutesAgo(2),
    lineItems: [ { menuItemId: 'itm_marg', name: 'Margherita', qty: 2, unitPrice: 14.00 }, { menuItemId: 'itm_knot', name: 'Garlic knots', qty: 1, unitPrice: 6.20 } ] },
  { id: 'ORD-4820', restaurantId: 'rst_trattoria', status: 'out_for_delivery', total: 41.00, placedAt: minutesAgo(9),
    lineItems: [ { menuItemId: 'itm_carb', name: 'Carbonara', qty: 1, unitPrice: 19.00 }, { menuItemId: 'itm_red', name: 'House red', qty: 2, unitPrice: 11.00 } ] },
  { id: 'ORD-4819', restaurantId: 'rst_trattoria', status: 'received', total: 57.50, placedAt: minutesAgo(11),
    lineItems: [ { menuItemId: 'itm_lasa', name: 'Lasagne', qty: 3, unitPrice: 19.00 } ] },
  { id: 'ORD-4818', restaurantId: 'rst_trattoria', status: 'delivered', total: 28.75, placedAt: minutesAgo(24),
    lineItems: [ { menuItemId: 'itm_calz', name: 'Calzone', qty: 1, unitPrice: 16.50 }, { menuItemId: 'itm_tira', name: 'Tiramisu', qty: 1, unitPrice: 9.00 } ] },
  { id: 'ORD-4817', restaurantId: 'rst_trattoria', status: 'cancelled', total: 18.00, placedAt: minutesAgo(38),
    lineItems: [ { menuItemId: 'itm_focc', name: 'Focaccia board', qty: 1, unitPrice: 18.00 } ] },
  { id: 'ORD-4814', restaurantId: 'rst_trattoria', status: 'out_for_delivery', total: 52.40, placedAt: minutesAgo(46),
    lineItems: [ { menuItemId: 'itm_lasa', name: 'Lasagne', qty: 1, unitPrice: 19.00 }, { menuItemId: 'itm_carb', name: 'Carbonara', qty: 1, unitPrice: 19.00 }, { menuItemId: 'itm_knot', name: 'Garlic knots', qty: 2, unitPrice: 6.20 } ] }
];

export const deliveries = [
  { id: 'dlv_4820', orderId: 'ORD-4820', status: 'on_route', courierName: 'Dani Okafor',   assignedAt: minutesAgo(7),  deliveredAt: null, etaLabel: 'ETA 12 min' },
  { id: 'dlv_4814', orderId: 'ORD-4814', status: 'delayed',  courierName: 'Sam Whitfield', assignedAt: minutesAgo(40), deliveredAt: null, etaLabel: '6 min late' },
  { id: 'dlv_4819', orderId: 'ORD-4819', status: 'pending',  courierName: null,            assignedAt: null,           deliveredAt: null, etaLabel: 'Awaiting courier' },
  { id: 'dlv_4818', orderId: 'ORD-4818', status: 'delivered', courierName: 'Dani Okafor',  assignedAt: minutesAgo(22), deliveredAt: minutesAgo(6), etaLabel: 'Delivered' }
];

export const payments = [
  { id: 'pay_4821', orderId: 'ORD-4821', amount: 34.20, status: 'paid',    method: 'Visa ···4821', processedAt: minutesAgo(2) },
  { id: 'pay_4820', orderId: 'ORD-4820', amount: 41.00, status: 'paid',    method: 'Apple Pay',    processedAt: minutesAgo(9) },
  { id: 'pay_4819', orderId: 'ORD-4819', amount: 57.50, status: 'pending', method: 'Mastercard ···1180', processedAt: minutesAgo(11) },
  { id: 'pay_4818', orderId: 'ORD-4818', amount: 28.75, status: 'paid',    method: 'Cash',         processedAt: minutesAgo(24) },
  { id: 'pay_4817', orderId: 'ORD-4817', amount: 18.00, status: 'failed',  method: 'Visa ···3302', processedAt: minutesAgo(38) }
];

export const dashboard = {
  dateLabel: 'Thursday, 17 September',
  greeting: 'Good afternoon, Rosa',
  kpis: [
    { label: 'Orders today',    value: '218',    delta: '+14 vs last Thursday',   tone: 'success' },
    { label: 'Net sales',       value: '$6,420', delta: '+8.1% week over week',   tone: 'success' },
    { label: 'In flight',       value: '7',      delta: '2 running past ETA',     tone: 'warning' },
    { label: 'Failed payments', value: '3',      delta: '$142 unreconciled',      tone: 'danger'  }
  ],
  paymentsToday: [
    { label: 'Paid',            value: '$6,278', tone: 'success' },
    { label: 'Pending capture', value: '$284',   tone: 'warning' },
    { label: 'Failed',          value: '$142',   tone: 'danger'  }
  ],
  needsReconciliation: 3,
  activity: [
    { when: '2m ago',  what: 'Margherita marked unavailable at Eastgate Counter' },
    { when: '18m ago', what: 'Payment for #ORD-4817 refunded in full' },
    { when: '1h ago',  what: 'Harbourline Kitchen opened for the day' },
    { when: '3h ago',  what: 'Lunch menu prices updated — 6 items' }
  ]
};

export const ORDER_STATUS = {
  received:         { label: 'Received',         tone: 'neutral' },
  preparing:        { label: 'Preparing',        tone: 'info'    },
  out_for_delivery: { label: 'Out for delivery', tone: 'warning' },
  delivered:        { label: 'Delivered',        tone: 'success' },
  cancelled:        { label: 'Cancelled',        tone: 'danger'  }
};

export const DELIVERY_STATUS = {
  pending:   { label: 'Pending',   tone: 'neutral' },
  on_route:  { label: 'On route',  tone: 'info'    },
  delayed:   { label: 'Delayed',   tone: 'warning' },
  delivered: { label: 'Delivered', tone: 'success' }
};

export const PAYMENT_STATUS = {
  paid:    { label: 'Paid',    tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed:  { label: 'Failed',  tone: 'danger'  }
};

export const relativeTime = iso => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? hrs + 'h ago' : 'Yesterday';
};

export const money = n => '$' + n.toFixed(2);

// Fake network: resolves after a beat so loading states are exercisable.
export const fakeRequest = (payload, ms = 450) =>
  new Promise(resolve => setTimeout(() => resolve(payload), ms));
