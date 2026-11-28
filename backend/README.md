# ScarfaceEV backend

Separate TypeScript/Express REST API for the ScarfaceEV React/Vite website. It uses PostgreSQL and Prisma, and is versioned under `/api/v1`.

## Requirements

- Node.js 20+
- npm
- PostgreSQL 14+ for migrations and persistence
- Resend credentials for outbound email (optional in local development)
- S3-compatible credentials only when `STORAGE_PROVIDER=s3`

Email/password authentication, provider sign-in, persistent sessions, and password reset are available through the auth endpoints below. There is no admin UI or admin API; administrative domain service methods remain internal and are not exposed as HTTP routes.

## Setup

From this directory:

```powershell
npm install
Copy-Item .env.example .env
```

Set `DATABASE_URL` in `.env` to a reachable PostgreSQL database, then:

```powershell
npm run prisma:generate
npm run db:deploy
npm run db:seed
npm run dev
```

`npm run db:deploy` applies checked-in migrations without creating new migrations. For schema development, use `npm run db:migrate -- --name <migration-name>`.

The seed command inserts the existing ScarfaceEV Tall Charger copy and placeholder values already present in the frontend. It does not invent price, availability, certifications, or technical specifications. No jobs or CMS pages are seeded.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the TypeScript API with `tsx watch`. |
| `npm run build` | Compile backend runtime source to `dist/` (tests and seed source are not included). |
| `npm start` | Run the compiled server. |
| `npm run typecheck` | Run TypeScript without emitting output. |
| `npm test` | Run API/unit tests. |
| `npm run prisma:generate` | Generate Prisma Client. |
| `npm run db:migrate -- --name ...` | Create/apply a development migration. |
| `npm run db:deploy` | Apply checked-in migrations in a deployment. |
| `npm run db:seed` | Seed the existing charger record. |

Swagger UI is available at `/api/docs` and the OpenAPI document at `/api/openapi.json` in development/test only. The health endpoint is `/api/v1/health`; it returns 503 when PostgreSQL is unavailable without revealing infrastructure details.

## Implemented public endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/health` | API and database health. |
| `POST` | `/api/v1/enquiries` | Persist the existing contact form enquiry and queue its company email notification. Accepts the current `name` field or the API alias `fullName`. |
| `GET` | `/api/v1/products` | Paginated published products, optional category filter. |
| `GET` | `/api/v1/products/:id` | Published product by UUID. |
| `POST` | `/api/v1/installation-requests` | Submit a structured installation/site-assessment request. |
| `GET` | `/api/v1/jobs` | Paginated published job openings. |
| `GET` | `/api/v1/jobs/:id` | Published job by UUID. |
| `POST` | `/api/v1/jobs/applications` | Multipart application with a private PDF resume. |
| `GET` | `/api/v1/content/pages` | Paginated published CMS pages. |
| `GET` | `/api/v1/content/pages/:slug` | Published page with ordered content sections. |
| `GET` | `/api/v1/media/:id` | Retrieve public media only; private resumes return 404. |
| `POST` | `/api/auth/register` | Register with email/password and start a persistent session. |
| `POST` | `/api/auth/login` | Authenticate with email/password. |
| `GET` | `/api/auth/me` | Return the current authenticated profile. |
| `POST` | `/api/auth/logout` | Revoke the current database-backed session. |
| `POST` | `/api/auth/profile/complete` | Set the phone number for the signed-in user. |
| `POST` | `/api/auth/password/forgot` | Request a one-time password-reset link by email. |
| `POST` | `/api/auth/password/reset` | Set a new password with an unexpired reset token. |
| `GET` / `POST` | `/api/auth/oauth/:provider` | Start Google, Microsoft, Apple, or GitHub sign-in. |
| `POST` | `/api/auth/oauth/:provider/link` | Link a provider identity to the currently signed-in account. |
| `GET` / `POST` | `/api/auth/oauth/:provider/callback` | Complete provider sign-in (Apple uses the form-post callback). |

The same auth router is also mounted at `/api/v1/auth`. Mutating auth requests validate the browser origin, credential and reset routes are rate-limited, and session cookies are HttpOnly. New sessions are random opaque tokens stored as SHA-256 hashes in PostgreSQL; logout and password reset revoke database-backed sessions. Legacy stateless signed cookies are rejected; users must sign in again after migrating to database-backed sessions.

OAuth provider credentials are backend-only. `BACKEND_URL` must be the public Render API origin. Register callbacks at `${BACKEND_URL}/api/auth/oauth/<provider>/callback` and configure the corresponding `*_CLIENT_ID` and `*_CLIENT_SECRET` values in the backend environment. Set frontend `VITE_API_BASE_URL` to that same public API origin and allow the frontend's origin in `FRONTEND_URL` or `CORS_ORIGINS`. Apple additionally requires `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY`; store the private key in the deployment secret manager and encode line breaks as `\n` if needed. Microsoft defaults to the `consumers` tenant; set `MICROSOFT_TENANT_ID` for another tenant. A provider with missing credentials is unavailable and returns a configuration error rather than falling back to another authentication method.

Password-reset email requires `EMAIL_PROVIDER=resend` and the existing Resend sender/API settings. Reset tokens are single-use, expire after 30 minutes, and are stored only as hashes. The reset email links to the frontend `reset-password.html` page. The API returns a generic acceptance response whether or not an account exists for the submitted email.

## Environment

See [.env.example](./.env.example). Important values:

- `DATABASE_URL`: PostgreSQL connection string.
- `NODE_ENV=production`, `DATABASE_URL`, `FRONTEND_URL`, `BACKEND_URL`, `CORS_ORIGINS`, `TRUST_PROXY_HOPS`: production runtime, database, browser origin, and reverse-proxy settings. Production rejects localhost URLs and local file storage.
- `BACKEND_URL`: externally reachable API base URL used when constructing OAuth callback URIs.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: optional provider credentials; configure only on the backend.
- `EMAIL_PROVIDER=disabled|resend`: defaults to disabled. To accept emailed website enquiries, set `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, `EMAIL_FROM` (a verified sender), and `ENQUIRY_RECEIVER_EMAIL` (the company recipient). The receiver is backend-only and has no default. `COMPANY_NOTIFICATION_EMAIL` is an optional recipient for other company notifications.
- `SEND_CUSTOMER_ACK`: optional customer acknowledgement; false by default.
- `STORAGE_PROVIDER=local|s3`: local storage is for development; configure private S3-compatible storage for production.
- `MAX_RESUME_SIZE_BYTES`, `MAX_MEDIA_SIZE_BYTES`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`: bounded upload and rate-limit settings.

Do not commit `.env`. Never put backend secrets in `VITE_` variables. Enquiry submission returns a configuration error while email is disabled or the receiver is missing. Once Resend is configured, the enquiry and its notification are committed together to the database outbox; the worker retries delivery failures. The email includes the name, email, optional phone, interest, message, and submission time, and sets the customer's email as Reply-To. The frontend submits to `/api/v1/enquiries` by default. Local tests use a mocked email provider and do not send real messages.

To test locally, copy `.env.example` to `.env`, configure a reachable PostgreSQL database and the Resend settings above, then start the backend with `npm run dev`. Start the frontend separately; its Vite `/api` proxy targets the local backend. Submit the form and verify receipt at `ENQUIRY_RECEIVER_EMAIL`. For production, store the Resend API key and receiver in Render environment settings, use a verified sender/domain, and ensure the backend worker can reach Resend and PostgreSQL. Do not configure email credentials in frontend environment variables.

## Data and modules

- `Enquiry`: normalized contact details, interest, message, lifecycle status, timestamps.
- `Product` / `ProductMedia`: published product content and optional ordered media. The initial seed is sourced from the current frontend placeholders.
- `InstallationRequest`: customer, installation/property type, address, requirements, and request status.
- `Job` / `JobApplication`: published openings and applicant records. Resumes are stored privately as media metadata plus a storage key.
- `ContentPage` / `ContentSection`: draft/published structured pages and SEO fields.
- `MediaAsset`: file metadata, visibility, MIME type, checksum, and storage key; file bytes are stored through a storage adapter.
- `NotificationOutbox`: deduplicated email notification jobs with retry state and provider reference.

Public API routes only retrieve published products/jobs/pages. No fake product attributes, open positions, or CMS pages are seeded. Media is validated by file signature as well as size; generic media upload is internal until an authenticated administration interface is available.

## Email and storage behavior

The email worker uses a configurable provider abstraction. The included Resend adapter is activated only when explicitly configured. It retries failed deliveries with bounded exponential delay and marks exhausted notifications failed; successfully queued enquiries remain persisted if a later delivery attempt fails.

The storage adapter supports local development storage and private S3-compatible storage. The only public upload route is the careers application route, and it accepts PDF resumes only. Resume downloads are not exposed publicly. Product/CMS media write operations remain internal until protected admin routes are added.

## Testing

`npm test` runs isolated API tests that inject service adapters; tests do not send real email or upload real customer documents. Database migration/transaction tests require a separately provisioned PostgreSQL test database. Set `DATABASE_URL` to that database before running migrations or integration checks. Do not point tests at production data.

## Deployment checklist

1. Create a Render PostgreSQL database and set its production `DATABASE_URL`.
2. Create a Render Web Service with root `backend`, build command `npm ci && npm run prisma:generate && npm run build`, start command `npm start`, and health check `/api/v1/health`.
3. Configure Render environment values: `NODE_ENV=production`, `FRONTEND_URL` as the Vercel origin, `BACKEND_URL` as the Render origin, `CORS_ORIGINS` for any additional exact origins, and `TRUST_PROXY_HOPS=1`.
4. Configure durable private S3-compatible storage (`STORAGE_PROVIDER=s3`, bucket, region, and backend credentials) before accepting production job applications.
5. Apply migrations with `npm run db:deploy` as a deliberate deployment/pre-deploy step; do not run development migration or reset commands against production.
6. Configure Resend and OAuth provider credentials in Render, and register provider callback URLs using the public Render origin.
7. Create a Vercel project with root `scarface-frontend`, build command `npm run build`, output directory `dist`, and `VITE_API_BASE_URL` set to the Render API origin.
8. Verify login, registration, Google/Apple OAuth, account linking, password reset, enquiry email, uploads, and the health check. When adding the custom domain, update frontend/backend origin settings and provider redirect URLs.
9. Configure database backups, monitoring, and PII-safe log retention. Admin APIs are not implemented or exposed.
