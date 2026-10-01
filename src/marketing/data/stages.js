import { DOT } from '../lib/css.jsx';

const G = DOT.green;
const O = DOT.orange;

/** The seven stages one order passes through — drives the hero window + flow section. */
export const STAGES = [
  {
    n: '01', short: 'Order', mod: 3, url: 'app.preduit.com/sales/orders',
    tab: 'Orders', tab2: 'Fulfillment board',
    title: 'The order lands', module: 'Sales & Orders',
    blurb: 'Orders arrive from your stores, wholesale reps and connected channels into one queue — credit-checked against the customer ledger before anyone cuts fabric.',
    chips: ['Channel sync', 'Credit hold rules', 'Fulfillment board'],
    cols: ['Order', 'Customer', 'Qty', 'Status'],
    rows: [
      { a: 'SO-24118', b: 'Northgate Retail Group', c: '1,240 pcs', d: 'Confirmed', dot: G },
      { a: 'SO-24119', b: 'Vela Boutique', c: '310 pcs', d: 'Credit hold', dot: O },
      { a: 'SO-24120', b: 'Anchor Outlet Co.', c: '2,050 pcs', d: 'Confirmed', dot: G },
    ],
    k: 'Order value', v: 'Rs 4,182,000',
  },
  {
    n: '02', short: 'Plan', mod: 10, url: 'app.preduit.com/ai/recommendations',
    tab: 'SKU Recommendations', tab2: 'Demand Projection',
    title: 'Demand gets planned', module: 'Demand Planning',
    blurb: 'Preduit projects demand per SKU and size curve, flags coverage gaps and validates the order against what you can actually deliver this quarter.',
    chips: ['Product KPIs', 'Size-curve coverage', 'Order validation'],
    cols: ['SKU', 'Size curve', 'Projected', 'Action'],
    rows: [
      { a: 'TS-1042', b: 'S · M · L · XL', c: '3,600', d: 'Build 2,400', dot: G },
      { a: 'DN-2210', b: '28 · 30 · 32', c: '900', d: 'Hold', dot: O },
      { a: 'KN-0087', b: 'One size', c: '5,120', d: 'Build 5,000', dot: G },
    ],
    k: 'Coverage', v: '92% of Q3 demand',
  },
  {
    n: '03', short: 'Procure', mod: 4, url: 'app.preduit.com/procurement/pos',
    tab: 'Purchase Orders', tab2: 'Approval Queue',
    title: 'Fabric gets bought', module: 'Procurement',
    blurb: 'POs go out with size-level lines, route through your approval rules, and hit the supplier ledger the moment goods are received — three-way matched against the invoice.',
    chips: ['Approval queue', 'Size-level PO lines', 'Supplier invoices'],
    cols: ['PO', 'Supplier', 'Value', 'Approval'],
    rows: [
      { a: 'PO-8841', b: 'Riaz Textiles', c: 'Rs 1,860,000', d: 'Approved', dot: G },
      { a: 'PO-8842', b: 'Indus Trims', c: 'Rs 214,500', d: 'Level 2', dot: O },
      { a: 'PO-8843', b: 'Chenab Dyeing', c: 'Rs 640,000', d: 'Approved', dot: G },
    ],
    k: 'On order', v: 'Rs 2,714,500',
  },
  {
    n: '04', short: 'Make', mod: 6, url: 'app.preduit.com/production/pboard',
    tab: 'Stage Board', tab2: 'Bill of Materials',
    title: 'The floor runs on facts', module: 'Production',
    blurb: 'BOMs explode into material issues; jobs move across cut, stitch, wash and finish with WIP visible per stage instead of estimated from a whiteboard.',
    chips: ['BOM explosion', 'Stage board', 'WIP by line'],
    cols: ['Job', 'Stage', 'Pieces', 'Line'],
    rows: [
      { a: 'PRD-511', b: 'Stitching', c: '640', d: 'Line 2', dot: O },
      { a: 'PRD-512', b: 'Cutting', c: '1,200', d: 'Line 1', dot: O },
      { a: 'PRD-509', b: 'Finishing', c: '480', d: 'Line 4', dot: G },
    ],
    k: 'Work in progress', v: '2,320 pcs',
  },
  {
    n: '05', short: 'Inspect', mod: 7, url: 'app.preduit.com/quality/inspections',
    tab: 'Inspections', tab2: 'Quality Scores',
    title: 'Quality becomes proof', module: 'Quality',
    blurb: 'AQL inspections attach to the job, defects are typed rather than described, and supplier scores follow the vendor into their next purchase order.',
    chips: ['AQL sampling', 'Defect taxonomy', 'Supplier scores'],
    cols: ['Inspection', 'Job', 'Result', 'Defect rate'],
    rows: [
      { a: 'QC-3301', b: 'PRD-509 · Finishing', c: 'Pass', d: '1.4%', dot: G },
      { a: 'QC-3302', b: 'PRD-511 · Stitching', c: 'Re-inspect', d: '4.8%', dot: O },
      { a: 'QC-3300', b: 'PRD-508 · Wash', c: 'Pass', d: '0.9%', dot: G },
    ],
    k: 'Pass rate', v: '96.7% this month',
  },
  {
    n: '06', short: 'Ship', mod: 8, url: 'app.preduit.com/shipments/shipments',
    tab: 'Shipments', tab2: 'Carriers',
    title: 'It leaves the building', module: 'Shipments',
    blurb: 'Packing lists, carriers and stock transfers move as one action — inventory drops when the truck does, not when someone remembers to update a sheet.',
    chips: ['Packing lists', 'Carrier rates', 'Stock transfers'],
    cols: ['Shipment', 'Carrier', 'Cartons', 'ETA'],
    rows: [
      { a: 'SH-1907', b: 'Falcon Freight', c: '48', d: '12 Aug', dot: O },
      { a: 'SH-1908', b: 'TCS Cargo', c: '12', d: '09 Aug', dot: O },
      { a: 'SH-1906', b: 'Falcon Freight', c: '60', d: 'Delivered', dot: G },
    ],
    k: 'In transit', v: '120 cartons',
  },
  {
    n: '07', short: 'Settle', mod: 5, url: 'app.preduit.com/finance/customerledger',
    tab: 'Customer ledger', tab2: 'Banking',
    title: 'The books close themselves', module: 'Finance',
    blurb: 'Every movement above posts to a real double-entry ledger. AR and AP aging, FX gain and loss and bank reconciliation all come out of the same data — never a month-end spreadsheet.',
    chips: ['GL engine', 'AR / AP aging', 'Bank reconciliation'],
    cols: ['Entry', 'Account', 'Debit', 'Credit'],
    rows: [
      { a: 'JE-9042', b: 'Trade receivables', c: '4,182,000', d: 'Posted', dot: G },
      { a: 'JE-9042', b: 'Revenue — wholesale', c: '4,182,000', d: 'Posted', dot: G },
      { a: 'JE-9043', b: 'Cost of goods sold', c: '2,610,400', d: 'Posted', dot: G },
    ],
    k: 'Unreconciled', v: 'Rs 0.00',
  },
];
