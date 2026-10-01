/** Static marketing copy, in section order. */

export const HERO_PROOF = [
  { icon: 'ph-fill ph-check-circle', label: 'Live in 3 weeks' },
  { icon: 'ph-fill ph-database', label: 'Your data, exportable' },
  { icon: 'ph-fill ph-shield-check', label: 'Row-level company isolation' },
];

const MARQUEE_WORDS = [
  'Catalog', 'Size curves', 'Stock transfers', 'Reorder alerts', 'Sales orders',
  'Fulfillment board', 'Purchase orders', 'Approval queue', 'Supplier ledger',
  'Bill of materials', 'Stage board', 'AQL inspections', 'Defect types',
  'Packing lists', 'Carriers', 'Channel sync', 'Demand projection',
  'Customer ledger', 'AR / AP aging', 'FX gain & loss', 'Bank reconciliation', 'Audit log',
];
/** Doubled so the -50% marquee translate loops seamlessly. */
export const MARQUEE = [...MARQUEE_WORDS, ...MARQUEE_WORDS];

export const PAINS = [
  { t: 'The order lives in three places', d: "A rep's sheet, a WhatsApp confirmation and the invoice book — none of which agree by Friday." },
  { t: 'Stock is a guess until someone counts', d: 'Shop floor, warehouse and marketplace each hold their own number.' },
  { t: 'Costing happens after the fact', d: 'Fabric, trims and labour get reconciled a month after the goods shipped.' },
  { t: 'Quality lives in a notebook', d: 'Defects are described in words, so no supplier is ever measured.' },
  { t: 'Month-end is a project', d: 'Exports, pivot tables and two evenings of chasing a variance.' },
];

export const GAINS = [
  { t: 'One order record, start to finish', d: 'Entered once, visible to sales, planning, the floor and finance at the same moment.' },
  { t: 'Stock moves when goods move', d: 'Transfers, receipts and shipments post in real time, per location and per size.' },
  { t: 'Cost attaches to the job', d: 'BOM issues and production stages carry cost into COGS automatically.' },
  { t: 'Defects are typed and scored', d: 'AQL results roll into supplier scores that follow them into the next PO.' },
  { t: 'The close is a review, not a rebuild', d: 'Aging, FX and reconciliation read straight from the ledger — variance zero.' },
];

export const ROLES = [
  { who: 'Owner / CFO', icon: 'ph-fill ph-chart-line-up', pain: '"Am I actually making money?"', gain: 'Margin by style, customer and channel from posted ledger data — not an estimate a spreadsheet produced last week.', screens: 'Finance › Profitability · Reports · Banking' },
  { who: 'Operations lead', icon: 'ph-fill ph-squares-four', pain: '"What can I promise this buyer?"', gain: 'Live stock by location and size, open POs and projected demand in one view before the order is confirmed.', screens: 'Sales › Fulfillment board · Inventory › Stock' },
  { who: 'Production manager', icon: 'ph-fill ph-factory', pain: '"Where is job 511 right now?"', gain: 'Cut, stitch, wash and finish as a board with WIP per line, plus material issues against the BOM.', screens: 'Production › Stage board · Bill of Materials' },
  { who: 'Accountant', icon: 'ph-fill ph-scales', pain: '"Will this survive an audit?"', gain: 'Double-entry journals for every movement, a chart of accounts you control, and an audit log of who changed what.', screens: 'Finance › Ledgers · Admin › Audit log' },
];

export const LEDGER = [
  { je: 'JE-9042', acct: 'Trade receivables — Northgate', dr: '4,182,000', cr: '—' },
  { je: 'JE-9042', acct: 'Revenue — wholesale', dr: '—', cr: '4,182,000' },
  { je: 'JE-9043', acct: 'Cost of goods sold', dr: '2,610,400', cr: '—' },
  { je: 'JE-9043', acct: 'Finished goods inventory', dr: '—', cr: '2,610,400' },
];

export const SEC_CHIPS = ['row_level_security', 'company_id scope', 'audit_log', 'role_permissions'];

export const BARS = [42, 58, 71, 64, 80, 92, 76, 88, 61, 73, 95, 84].map((h, i) => ({
  h: `${h}%`,
  fill: i % 3 === 2 ? 'rgba(255,255,255,0.22)' : 'linear-gradient(180deg,#4BD313,#24B34B)',
}));

export const STATS = [
  { value: '12', to: 12, label: 'Modules, one login', note: 'From catalog to audit log — no third-party stitching.' },
  { value: '50', to: 50, label: 'Screens shipped', note: 'Lists, boards, dashboards and settings, all consistent.' },
  { value: '1', to: 1, label: 'Source of truth', note: 'One Postgres schema. Stock, cost and ledger cannot drift.' },
  { value: '0', to: 0, label: 'Month-end exports', note: 'Aging, FX and reconciliation read live from the ledger.' },
];

export const PHASES = [
  { when: 'Week 1', title: 'Foundation', body: 'Company profile, users and roles, chart of accounts, opening balances. Your catalog and size curves imported from whatever you have today.', done: 'Catalog live' },
  { when: 'Week 2', title: 'Sell and stock', body: 'Order entry, customers, locations and stock levels switched on. Your team raises real orders while the old sheet runs alongside.', done: 'Orders entered in Preduit' },
  { when: 'Week 3', title: 'Make and buy', body: 'BOMs loaded, suppliers and approval rules configured, stage board mapped to your actual lines and inspection points.', done: 'First job costed end to end' },
  { when: 'Go-live', title: 'Close the books', body: 'Invoicing, ledgers and bank reconciliation go live; we run a parallel close against your existing numbers and sign off the variance.', done: 'First clean month-end' },
];

export const FAQS = [
  { q: 'We already run accounting software. Do we rip it out?', a: 'No. Preduit posts to its own ledger and exports a journal your accountant can import, so you can run both for a cycle and compare. Most teams retire the old system after the first clean close — but on their schedule, not ours.' },
  { q: 'How long does implementation actually take?', a: 'Around three weeks depending on module count. Week one is catalog, size curves and opening balances; week two is live order entry. Week three brings production, quality and the first close once your BOMs are loaded. Migration and training are included in the licence.' },
  { q: 'Can we run multiple companies or brands?', a: 'Yes — every table is scoped by company with row-level security enforced in the database. One login, a company switcher, and reporting that either consolidates or stays separate. Isolation is not a UI filter you can accidentally bypass.' },
  { q: 'What about our marketplace and retail POS channels?', a: 'The Channels module holds connections and sync logs, so orders and stock land in the same queue as wholesale and are reconciled against what the channel thinks it has. Failed syncs are visible, not silent.' },
  { q: 'Who owns the data, and can we get it out?', a: 'You do. Full schema-level export on request, plus per-module CSV from every screen. There is no export fee and no proprietary lock on your ledger history.' },
];

export const TRUST = [
  { icon: 'ph-fill ph-users-three', t: 'Reference calls', d: 'Speak to teams in your segment and size before you commit — unscripted, without us on the line.' },
  { icon: 'ph-fill ph-file-magnifying-glass', t: 'Security review pack', d: 'Architecture notes, tenancy model, backup and retention policy, and our pen-test summary.' },
  { icon: 'ph-fill ph-database', t: 'Exit plan on paper', d: 'Full schema export on request, no export fee, ledger history yours to keep.' },
  { icon: 'ph-fill ph-currency-circle-dollar', t: 'Fixed-price implementation', d: 'Migration, configuration and training quoted up front — hours are not billed against you later.' },
];

export const ONBOARDING = [
  { n: '01', t: 'Sandbox with your data', d: 'We load your catalog sample and opening balances.' },
  { n: '02', t: 'Walk your own order', d: 'Order to invoice to journal entry, on your numbers.' },
  { n: '03', t: 'Pick your modules', d: 'Start with three; the rest switch on later.' },
  { n: '04', t: 'Team invites', d: 'Roles and approval limits set before go-live.' },
];

export const FOOTER_COLS = [
  { title: 'Product', links: ['Modules', 'How it works', 'Pricing', 'Security'] },
  { title: 'Company', links: ['About', 'Careers', 'Partners', 'Contact'] },
  { title: 'Resources', links: ['Implementation guide', 'Migration checklist', 'Status', 'Support'] },
];

/** Pricing tiers — `annual` switches the headline number and the per-line. */
export function plans(annual) {
  const price = (m, a) => `Rs ${(annual ? a : m).toLocaleString('en-US')}`;
  const per = annual ? '/ mo, billed yearly' : '/ month';
  return [
    {
      name: 'Starter', who: 'Single company finding its feet on real systems.',
      price: price(24000, 19200), per,
      features: ['Catalog, Inventory, Sales & Orders', 'Up to 5 users, 1 company', 'Invoices and customer ledger', 'Migration + 2 training sessions'],
      cta: 'Start with Starter', bg: '#fff', border: 'var(--border)', shadow: 'var(--shadow-sm)',
      fg: 'var(--fg1)', fg2: 'var(--fg2)', rule: 'var(--border)', tick: 'var(--success)',
      ctaFg: 'var(--fg1)', ctaBg: '#fff', ctaBorder: 'var(--border-strong)', featured: false,
    },
    {
      name: 'Growth', who: 'Brands that make, inspect and ship their own goods.',
      price: price(64000, 51200), per,
      features: ['Everything in Starter, plus Procurement, Production, Quality and Shipments', 'Full Finance module with GL engine', 'Up to 25 users, 3 companies', 'Channel connections and sync logs', 'Approval rules and audit log'],
      cta: 'Book a Growth demo', bg: 'linear-gradient(165deg,#FFF7EF,#fff 55%)', border: 'var(--orange-300)',
      shadow: '0 18px 44px rgba(245,130,32,0.18)', fg: 'var(--fg1)', fg2: 'var(--fg2)',
      rule: 'var(--orange-100)', tick: 'var(--primary)', ctaFg: '#fff', ctaBg: 'var(--primary)',
      ctaBorder: 'var(--primary)', featured: true,
    },
    {
      name: 'Enterprise', who: 'Multi-entity groups with consolidation and audit needs.',
      price: 'Custom', per: 'annual agreement',
      features: ['All twelve modules incl. Demand Planning', 'Unlimited companies with row-level isolation', 'SSO, custom roles, retention policies', 'Dedicated implementation lead', 'Priority SLA and quarterly reviews'],
      cta: 'Talk to sales', bg: 'var(--fg1)', border: 'var(--fg1)', shadow: 'var(--shadow-lg)',
      fg: '#fff', fg2: 'var(--neutral-400)', rule: 'rgba(255,255,255,0.12)', tick: 'var(--orange-300)',
      ctaFg: 'var(--fg1)', ctaBg: '#fff', ctaBorder: '#fff', featured: false,
    },
  ];
}
