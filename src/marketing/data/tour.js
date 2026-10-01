import { DOT } from '../lib/css.jsx';

const G = DOT.green;
const O = DOT.orange;

/** Six chapters of the auto-playing product tour. */
export const TOUR = [
  {
    n: '01', title: 'Set up the company', time: '0:00', mods: 'Admin · Catalog', mod: 11,
    url: 'app.preduit.com/admin/companies', tab: 'Companies', tab2: 'Users & roles',
    action: 'Invite user', icon: 'ph-fill ph-gear-six',
    caption: 'One workspace, your legal entities inside it. Roles and approval limits are set once, then every screen obeys them.',
    kpis: [
      { label: 'Companies', value: '3', delta: 'isolated at row level', tone: 'var(--fg3)' },
      { label: 'Users', value: '24', delta: '6 roles in use', tone: 'var(--fg3)' },
      { label: 'Modules on', value: '12 / 12', delta: 'all enabled', tone: 'var(--green-600)' },
    ],
    cols: ['Company', 'Legal name', 'Currency', 'Status'],
    rows: [
      { a: 'NRG-01', b: 'Northgate Retail Group (Pvt) Ltd', c: 'PKR', d: 'Active', dot: G },
      { a: 'NRG-02', b: 'Northgate Apparel Export', c: 'USD', d: 'Active', dot: G },
      { a: 'NRG-03', b: 'Vela Concept Stores', c: 'PKR', d: 'Setup', dot: O },
      { a: 'ROLE-04', b: 'Approval limit — Ops lead', c: 'Rs 500,000', d: 'Enforced', dot: G },
    ],
  },
  {
    n: '02', title: 'Know your stock', time: '0:13', mods: 'Inventory · Catalog', mod: 2,
    url: 'app.preduit.com/inventory/stock', tab: 'Stock Levels', tab2: 'Reorder Alerts',
    action: 'New transfer', icon: 'ph-fill ph-package',
    caption: 'Stock by location and by size — not one number for the whole company. Reorder alerts fire off real coverage, not a fixed minimum.',
    kpis: [
      { label: 'On hand', value: '41,860', delta: '+3,200 this week', tone: 'var(--green-600)' },
      { label: 'Below reorder', value: '7 SKUs', delta: 'alerts raised', tone: 'var(--primary)' },
      { label: 'In transfer', value: '1,140', delta: '4 movements', tone: 'var(--fg3)' },
    ],
    cols: ['SKU', 'Location', 'On hand', 'Cover'],
    rows: [
      { a: 'TS-1042', b: 'Central warehouse', c: '6,240', d: '38 days', dot: G },
      { a: 'TS-1042', b: 'Store — Gulberg', c: '310', d: '9 days', dot: O },
      { a: 'DN-2210', b: 'Central warehouse', c: '880', d: '11 days', dot: O },
      { a: 'KN-0087', b: 'Store — Clifton', c: '1,905', d: '52 days', dot: G },
    ],
  },
  {
    n: '03', title: 'Take the order', time: '0:26', mods: 'Sales & Orders · Channels', mod: 3,
    url: 'app.preduit.com/sales/orders', tab: 'Orders', tab2: 'Fulfillment Board',
    action: 'New order', icon: 'ph-fill ph-shopping-bag',
    caption: 'Wholesale, retail and marketplace orders land in one queue, credit-checked against the ledger before anyone promises a date.',
    kpis: [
      { label: 'Open orders', value: '38', delta: '12 ship this week', tone: 'var(--fg3)' },
      { label: 'Order book', value: 'Rs 18.4M', delta: '+9% vs last month', tone: 'var(--green-600)' },
      { label: 'On credit hold', value: '2', delta: 'blocked automatically', tone: 'var(--primary)' },
    ],
    cols: ['Order', 'Customer', 'Qty', 'Status'],
    rows: [
      { a: 'SO-24118', b: 'Northgate Retail Group', c: '1,240 pcs', d: 'Confirmed', dot: G },
      { a: 'SO-24119', b: 'Vela Boutique', c: '310 pcs', d: 'Credit hold', dot: O },
      { a: 'SO-24120', b: 'Anchor Outlet Co.', c: '2,050 pcs', d: 'Confirmed', dot: G },
      { a: 'SO-24121', b: 'Marketplace — Daraz', c: '86 pcs', d: 'Synced', dot: G },
    ],
  },
  {
    n: '04', title: 'Buy it and make it', time: '0:39', mods: 'Procurement · Production', mod: 6,
    url: 'app.preduit.com/production/pboard', tab: 'Stage Board', tab2: 'Bill of Materials',
    action: 'Issue material', icon: 'ph-fill ph-factory',
    caption: 'The order explodes into a fabric PO and a production job. Cut, stitch, wash and finish carry their own cost, so COGS is not a guess.',
    kpis: [
      { label: 'WIP', value: '2,320 pcs', delta: '4 lines running', tone: 'var(--fg3)' },
      { label: 'On order (fabric)', value: 'Rs 2.71M', delta: '3 POs open', tone: 'var(--fg3)' },
      { label: 'Cost variance', value: '−1.8%', delta: 'under standard', tone: 'var(--green-600)' },
    ],
    cols: ['Job', 'Stage', 'Pieces', 'Line'],
    rows: [
      { a: 'PRD-511', b: 'Stitching', c: '640', d: 'Line 2', dot: O },
      { a: 'PRD-512', b: 'Cutting', c: '1,200', d: 'Line 1', dot: O },
      { a: 'PRD-509', b: 'Finishing', c: '480', d: 'Line 4', dot: G },
      { a: 'PO-8841', b: 'Riaz Textiles — greige', c: 'Rs 1.86M', d: 'Received', dot: G },
    ],
  },
  {
    n: '05', title: 'Inspect and ship', time: '0:52', mods: 'Quality · Shipments', mod: 7,
    url: 'app.preduit.com/quality/inspections', tab: 'Inspections', tab2: 'Quality Scores',
    action: 'New inspection', icon: 'ph-fill ph-seal-check',
    caption: 'AQL results attach to the job and follow the supplier. When cartons leave, stock drops in the same action — no evening catch-up.',
    kpis: [
      { label: 'Pass rate', value: '96.7%', delta: '+1.2 pts', tone: 'var(--green-600)' },
      { label: 'Cartons out', value: '120', delta: '2 shipments', tone: 'var(--fg3)' },
      { label: 'Re-inspect', value: '1 job', delta: 'PRD-511 held', tone: 'var(--primary)' },
    ],
    cols: ['Ref', 'Against', 'Result', 'Detail'],
    rows: [
      { a: 'QC-3301', b: 'PRD-509 · Finishing', c: 'Pass', d: '1.4% AQL', dot: G },
      { a: 'QC-3302', b: 'PRD-511 · Stitching', c: 'Re-inspect', d: '4.8% AQL', dot: O },
      { a: 'SH-1907', b: 'Falcon Freight · Karachi', c: '48 ctn', d: 'ETA 12 Aug', dot: O },
      { a: 'SH-1906', b: 'Falcon Freight · Lahore', c: '60 ctn', d: 'Delivered', dot: G },
    ],
  },
  {
    n: '06', title: 'Close the books', time: '1:05', mods: 'Finance · Dashboards · Planning', mod: 5,
    url: 'app.preduit.com/finance/overview', tab: 'Overview', tab2: 'Banking',
    action: 'Post journal', icon: 'ph-fill ph-bank',
    caption: 'Every step above already posted a journal entry. Aging, FX and bank reconciliation read live from the ledger — the close is a review.',
    kpis: [
      { label: 'Revenue MTD', value: 'Rs 22.6M', delta: '+14% vs plan', tone: 'var(--green-600)' },
      { label: 'Gross margin', value: '37.4%', delta: 'by style, posted', tone: 'var(--fg3)' },
      { label: 'Unreconciled', value: 'Rs 0.00', delta: 'trial balance clean', tone: 'var(--green-600)' },
    ],
    cols: ['Entry', 'Account', 'Amount', 'State'],
    rows: [
      { a: 'JE-9042', b: 'Trade receivables — Northgate', c: '4,182,000', d: 'Posted', dot: G },
      { a: 'JE-9042', b: 'Revenue — wholesale', c: '4,182,000', d: 'Posted', dot: G },
      { a: 'JE-9043', b: 'Cost of goods sold', c: '2,610,400', d: 'Posted', dot: G },
      { a: 'FX-0221', b: 'FX revaluation — USD', c: '38,900', d: 'Posted', dot: G },
    ],
  },
];

export const TOUR_STEP_MS = 6600;
export const TOUR_TOTAL = '1:18';
