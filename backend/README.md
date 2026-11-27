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
| `npm run build` | Compile source and Prisma seed code to `dist/`. |
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
| `POST` | `/api/v1/enquiries` | Persist the existing contact form enquiry. Accepts the current `name` field or the API alias `fullName`. |
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
| `POST` | `/api/auth/password/forgot` | Request a one-time password-reset link by email. |
| `POST` | `/api/auth/password/reset` | Set a new password with an unexpired reset token. |
| `GET` / `POST` | `/api/auth/oauth/:provider` | Start Google, Microsoft, Apple, or GitHub sign-in. |
| `GET` / `POST` | `/api/auth/oauth/:provider/callback` | Complete provider sign-in (Apple uses the form-post callback). |

The same auth router is also mounted at `/api/v1/auth`. Mutating auth requests validate the browser origin, credential and reset routes are rate-limited, and session cookies are HttpOnly. New sessions are random opaque tokens stored as SHA-256 hashes in PostgreSQL; logout and password reset revoke database-backed sessions. Existing signed sessions continue to work until their original expiry after deployment.

OAuth provider credentials are backend-only. `BACKEND_URL` must be the public API origin the browser uses. Register callbacks at `${BACKEND_URL}/api/auth/oauth/<provider>/callback` and configure the corresponding `*_CLIENT_ID` and `*_CLIENT_SECRET` values in the backend environment. When the API is exposed on another host, set frontend `VITE_API_BASE_URL` to that same public API origin. Apple additionally requires `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY`; store the private key in the deployment secret manager and encode line breaks as `\n` if needed. Microsoft defaults to the `consumers` tenant; set `MICROSOFT_TENANT_ID` for another tenant. A provider with missing credentials is unavailable and returns a configuration error rather than falling back to another authentication method.

Password-reset email requires `EMAIL_PROVIDER=resend` and the existing Resend sender/API settings. Reset tokens are single-use, expire after 30 minutes, and are stored only as hashes. The reset email links to the frontend `reset-password.html` page. The API returns a generic acceptance response whether or not an account exists for the submitted email.

## Environment

See [.env.example](./.env.example). Important values:

- `DATABASE_URL`: PostgreSQL connection string.
- `FRONTEND_URL`, `CORS_ORIGINS`, `TRUST_PROXY_HOPS`: browser origin and reverse-proxy settings.
- `BACKEND_URL`: externally reachable API base URL used when constructing OAuth callback URIs.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: optional provider credentials; configure only on the backend.
- `EMAIL_PROVIDER=disabled|resend`: defaults to disabled. When enabled, `EMAIL_API_KEY`, `EMAIL_FROM`, and `COMPANY_NOTIFICATION_EMAIL` are required.
- `SEND_CUSTOMER_ACK`: optional customer acknowledgement; false by default.
- `STORAGE_PROVIDER=local|s3`: local storage is for development; configure private S3-compatible storage for production.
- `MAX_RESUME_SIZE_BYTES`, `MAX_MEDIA_SIZE_BYTES`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`: bounded upload and rate-limit settings.

Do not commit `.env`. Never put backend secrets in `VITE_` variables. With email disabled or the company recipient missing, enquiries still persist but no email is sent; the notification worker leaves queued records pending and logs the configuration state. This is intentional and must not be presented as successful delivery.

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

The email worker uses a configurable provider abstraction. The included Resend adapter is activated only when explicitly configured. It retries failed deliveries with bounded exponential delay, marks exhausted notifications failed, and does not block enquiry persistence.

The storage adapter supports local development storage and private S3-compatible storage. The only public upload route is the careers application route, and it accepts PDF resumes only. Resume downloads are not exposed publicly. Product/CMS media write operations remain internal until protected admin routes are added.

## Testing

`npm test` runs isolated API tests that inject service adapters; tests do not send real email or upload real customer documents. Database migration/transaction tests require a separately provisioned PostgreSQL test database. Set `DATABASE_URL` to that database before running migrations or integration checks. Do not point tests at production data.

## Deployment checklist

1. Provision PostgreSQL and apply `npm run db:deploy`.
2. Set and validate production environment variables and CORS origins.
3. Configure a real email provider/sender/recipient and verify domain deliverability if notifications are required.
4. Configure private object storage before accepting production resumes.
5. Serve frontend/API over HTTPS; configure `/api` reverse proxy and trusted proxy hops correctly.
6. Configure database backup/restore, PII-safe logs, monitoring, and retention/deletion procedures.
7. Keep admin methods unreachable until an authorization model and admin interface are implemented and reviewed.
