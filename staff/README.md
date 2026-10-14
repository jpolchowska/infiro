# Infiro Staff Panel

Next.js panel for administrators and teachers. Administrators manage course content, import tasks,
e-books and final tests, and assign students to teachers. Teachers get a read-only view of the course
and the progress of their own students.

Setup, environment variables and deployment are described in the [main README](../README.md).

## Structure

| Path | Contents |
| --- | --- |
| `app/` | Pages (App Router): course, students, teachers, content import, settings, login |
| `components/` | Shared UI, authentication context and gate, import forms, student report parts |
| `lib/api.ts` | Fetch wrapper with token handling and error mapping |
| `lib/data/` | Typed API calls grouped by resource |
| `hooks/` | `useApiData` loads page data with loading and error states, `useSubmit` runs saves and deletions |
| `lib/validateImport.ts` | Client-side validation of import files, mirroring the backend rules |

## Running

The panel runs as the `staff` service of the project's Docker Compose setup and is served through
nginx at `http://localhost`:

```bash
docker compose up --build staff
```

Authentication goes through Keycloak. The realm URL, realm name and client id come from the
`NEXT_PUBLIC_KEYCLOAK_*` variables.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
