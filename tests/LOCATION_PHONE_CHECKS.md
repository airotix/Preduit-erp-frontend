Shared location and phone checks
===============================

Country searches and phone parsing run locally in the browser. City queries are
debounced 250 ms, capped at 50 results, deduplicated, and cached (200 client entries,
512 backend entries). The backend uses a bundled read-only SQLite geographic index,
not an external service or the tenant database. Provinces are cached by country.

Customers and suppliers store ISO country codes and separate optional province/city
fields. Company/setup fields retain canonical country names to preserve existing
API and invoice presentation. Both names and ISO codes are accepted by validators.
Free-text sales regions, street addresses, warehouse bins and ports remain editable.
No existing contact numbers or address records are migrated automatically.

Phone numbers normalize to E.164. The 14-digit business cap includes country codes.
General phone fields accept landlines; fields named mobile apply mobile type checks.
Explicit international prefixes take precedence over the address country. Extensions
need a separate field and are not accepted as part of the phone number.

Verification:
- Backend: python -m unittest discover -s tests
- Frontend: npm run typecheck; node --test tests/*.test.cjs
- Manual fixture: temporarily re-export tests/fixtures/location-phone-preview.tsx
  from an app route; never deploy that preview route.
- Browser: select Pakistan, Punjab, Lahore; enter 0300 1234567; verify normalization.
  Change country; verify province/city reset and the existing phone remains intact.
  Test invalid lengths, foreign prefixes, keyboard selection and 320/375/768 widths.
- Rolled-back PostgreSQL verification checks ISO location and normalized phone storage
  for both customers and suppliers without retaining test records.

Backend dependencies include phonenumbers. After deploying, apply
backend/db/V067_pg__contact_locations.sql before running the updated backend.
To refresh geography, update country-state-city and run
backend/scripts/build_location_data.py. Include its license and attribution files.
