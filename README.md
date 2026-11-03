# MG Premier Series

Public registration availability and venue settings are stored in Netlify Database and served through `/api/event-settings`. All devices use the same saved settings. Visible pages refresh every 15 seconds and when returning to the page. Registrations initially open when there are no saved shared settings.

On `host.html`, use **Set up host account** with the official host email and a new password. Confirm the email, sign in, and save public page settings. The previous browser-only demo login is no longer used. Only the verified official host account can save settings. Password recovery is available on the login page.

Settings previously stored in a browser are not published automatically. Save the desired settings through the new host login. Registration records and payment screenshots remain the existing browser-local demo; this change shares public page settings only.

Database schema: `db/schema.ts`. Migrations in `netlify/database/migrations` are applied by Netlify during deployment.

Run `npm test` and `npm run typecheck` to check settings validation, fresh-browser registration visibility, and TypeScript.
