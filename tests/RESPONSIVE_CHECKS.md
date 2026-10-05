# Responsive verification

The landing page and shared ERP components were checked in the browser at
320, 375, 430, 768, 1024, 1440, and 1920 pixel widths. Both fit the viewport
without page-wide horizontal scrolling. Financial, invoice, and matrix tables
keep scrolling within their own keyboard-accessible containers.

The ERP checks used the temporary sample-data page in
`tests/fixtures/responsive-preview.tsx`, exercising the actual shared sidebar,
top bar, dashboard, record table, board, and form sheet. No real business records
were created or modified. The temporary application route was removed after
verification. Authenticated business workflows still need a device check using
the relevant roles and real records.

Checks completed:

- Landing mobile menu opens and exposes section links and signup.
- ERP navigation opens in a modal drawer and fits the phone viewport.
- Record labels remain readable, including long article names.
- Mobile sort control changes the displayed record order.
- Search resets pagination and shows matching records.
- Pagination displays the correct range on page two.
- Start action does not also invoke the containing record's click handler.
- Board stage selection exposes the chosen stage on phones.
- Form sheet spans the phone width, scrolls independently, and keeps the footer
  reachable. Inputs use 16 pixel text to avoid focus zoom on phones.
- At 740 by 375 pixels, the form body scrolls and its footer stays visible.

Performance changes split the landing page and shared screen renderers into
separate bundles. Landing animation timers pause while the document is hidden
and respect reduced motion; hero tilt only runs with a fine pointer.

To repeat sample checks locally, copy the fixture to
`src/app/responsive-preview/page.tsx` while the dev server is stopped. Remove that
temporary route when finished. Do not include it in a production build. Only one
Next.js dev/build process should use the default `.next` directory at a time.

Run `npm run typecheck` and `npm run build` after changes. Generated build caches
are disposable; stop the server before clearing or moving `.next`.
