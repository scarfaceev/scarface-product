# ScarfaceEV

ScarfaceEV is a responsive, single-page website for showcasing the company's EV charging products and providing contact/enquiry paths. The frontend is a React application built with Vite and is maintained in [`scarface-frontend/`](./scarface-frontend/).

The React frontend is under [`scarface-frontend/`](./scarface-frontend/). A separate API service is under [`backend/`](./backend/), built with Node.js, Express, TypeScript, PostgreSQL, and Prisma. The current backend provides public endpoints for enquiries, products, installation requests, jobs/applications, CMS pages, and public media. Login/registration and public admin APIs are intentionally not implemented.

## Contents

- [Project overview](#project-overview)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Technology stack](#technology-stack)
- [Setup and commands](#setup-and-commands)
- [Backend API](#backend-api)
- [Configuration and integrations](#configuration-and-integrations)
- [Where to make changes](#where-to-make-changes)
- [Assets and media](#assets-and-media)
- [Production and deployment](#production-and-deployment)
- [Content and release checklist](#content-and-release-checklist)

## Project overview

The site presents ScarfaceEV's chargers and related information in one continuous page. It includes:

- Responsive desktop and mobile navigation, with section links and expandable menus.
- A hero, product showcase, charger-photo viewer, specifications, features, app showcase, sustainability and company information sections.
- Installation information, a product gallery, FAQ, calls to action, contact details, and an enquiry form.
- Motion effects, responsive styling, keyboard-accessible controls, and reduced-motion handling in animated areas.
- An enquiry prompt, back-to-top control, and a cookie-preference notice. The notice only stores a local preference; no analytics or advertising tracking is configured.

The main charger-photo viewer is image-based: it rotates through supplied product images and supports manual selection, zoom, pointer dragging, and keyboard arrows. It is not a 3D model viewer. A separate `ChargerCanvas.jsx` component contains a conceptual React Three Fiber charger visual and is available for future use.

## Architecture

### Application startup and composition

1. `index.html` provides the browser document, page metadata, favicon, font stylesheet, and the `#root` mount point.
2. `src/main.jsx` creates the React root, loads the global stylesheet, and renders the app inside `React.StrictMode`.
3. `src/App.jsx` composes the shared page shell: `Header`, `Home`, `Footer`, and `Overlays`.
4. `src/pages/Home.jsx` renders the homepage content as an ordered set of page sections. The image-based `Product3DViewer` uses `React.lazy`/`Suspense` and is emitted as a separate asynchronous bundle chunk.
5. `src/styles/globals.css` supplies the shared design tokens, component styles, animation styles, and responsive breakpoints.

There is no client-side router because the current website is a single page. Navigation uses section IDs and URL fragments such as `#chargers`, `#gallery`, and `#contact`; the header also tracks the active section while scrolling.

### Component responsibilities

- **`components/Header.jsx`** — desktop mega menus, mobile menu/submenus, scroll state, Escape-key behavior, and active-section highlighting.
- **`components/Hero.jsx`** — hero content, image/video selection, and motion/reduced-motion behavior.
- **`components/Sections.jsx`** — reusable sections for products, specifications, comparison, datasheet, features, app showcase, installation, gallery, about, FAQ, CTA, contact, and sustainability.
- **`components/Product3DViewer.jsx`** — lazy-loaded product photo carousel, model/view controls, automatic rotation, pause/resume, zoom, drag, and keyboard navigation.
- **`components/ContactForm.jsx`** — input validation and optional JSON POST to the configured enquiry endpoint.
- **`components/Overlays.jsx`** — enquiry modal, back-to-top button, and local cookie-preference notice.
- **`components/Img.jsx` and `components/Icon.jsx`** — shared image/illustration and icon rendering helpers.
- **`components/Reveal.jsx`** — shared scroll reveal animation wrapper.
- **`components/Logo.jsx` and `components/Footer.jsx`** — reusable brand and footer UI.
- **`components/ChargerCanvas.jsx`** — a separate conceptual 3D charger visual; it is not the homepage photo carousel.

### Content and asset flow

Most visible copy and site configuration is kept in `src/data/`. Components consume those objects and arrays to render content. For example, `brandData.js` supplies brand/contact/hero content, `navigationData.js` supplies menu groups and section targets, and `imageAssets.js` maps image keys and charger-view sequences to imported files.

Files imported from `src/assets/` are processed and fingerprinted by Vite during a production build. Files in `public/` are copied as static files and referenced by their public URL. Use `src/assets/` for files imported from application code; use `public/` for files that need a stable URL or are not imported.

## Project structure

```text
scarfaceev-website/
├── .gitignore
├── README.md
├── SCARFACEEV Tall Charger Front (1).zip  # retained original image archive
├── backend/
│   ├── .env.example
│   ├── README.md
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── modules/
│   │   └── routes/
│   └── tests/
└── scarface-frontend/
    ├── .env.example
    ├── ATTRIBUTION.md
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── README.md
    ├── public/
    │   └── favicon.png
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── assets/
        │   ├── icons/                    # optional icon assets
        │   ├── images/
        │   │   ├── Hero_section_image.png
        │   │   └── charger-photos/
        │   │       └── SCARFACEEV Tall Charger Front (1)/
        │   │           ├── 1.png ... 9.png
        │   ├── logo/
        │   │   └── logo-removebg-preview.png
        │   ├── models/                   # optional 3D models
        │   └── videos/                   # optional hero videos
        ├── components/
        │   ├── ChargerCanvas.jsx
        │   ├── ContactForm.jsx
        │   ├── Footer.jsx
        │   ├── Header.jsx
        │   ├── Hero.jsx
        │   ├── Icon.jsx
        │   ├── Img.jsx
        │   ├── Logo.jsx
        │   ├── Overlays.jsx
        │   ├── Product3DViewer.jsx
        │   ├── Reveal.jsx
        │   └── Sections.jsx
        ├── data/
        │   ├── brandData.js
        │   ├── contentData.js
        │   ├── featuresData.js
        │   ├── imageAssets.js
        │   ├── navigationData.js
        │   ├── productData.js
        │   └── videoAssets.js
        ├── pages/
        │   └── Home.jsx
        └── styles/
            └── globals.css
```

The backend is a separate API service with its own `README.md`, `package.json`, Prisma schema and migrations, source, and tests; its setup and structure are documented in [`backend/README.md`](./backend/README.md). The frontend does not currently have separate hooks, layouts, or services directories. Local dependency installations and generated build output are ignored and are not part of the source tree.

## Technology stack

| Area | Technology |
|---|---|
| UI | React 18, React DOM |
| Language/module format | JavaScript with JSX, ES modules |
| Development server/build | Vite 5, `@vitejs/plugin-react` |
| Motion | Framer Motion |
| Icons | Lucide React |
| 3D visual support | Three.js, React Three Fiber, Drei |
| Styling | Project CSS in `src/styles/globals.css` |

Dependency versions and scripts are defined by [`scarface-frontend/package.json`](./scarface-frontend/package.json); the lockfile is [`scarface-frontend/package-lock.json`](./scarface-frontend/package-lock.json).

## Setup and commands

Requires Node.js 18 or newer and npm. From the repository root:

```powershell
Set-Location .\scarface-frontend
npm install
npm run dev
```

Vite prints the local development URL in the terminal. Stop the server with `Ctrl+C`.

Available scripts (run from `scarface-frontend/`):

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create the optimized production build in `scarface-frontend/dist/`. |
| `npm run preview` | Serve the built output locally for a production-style check. Run `npm run build` first. |

## Backend API

The backend is a Node.js 20+ / Express 5 API written in TypeScript. It uses PostgreSQL with Prisma for persistence and has its own dependencies, environment, migrations, and detailed documentation in [`backend/README.md`](./backend/README.md).

From the repository root, install and start the backend with PostgreSQL available:

```powershell
Set-Location .\backend
npm install
Copy-Item .env.example .env
npm run prisma:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Configure `DATABASE_URL` in `backend/.env` for your PostgreSQL database before running migrations. Prisma schema changes and the available database scripts are documented in [`backend/README.md`](./backend/README.md). Backend environment options, including optional email and storage provider settings, are listed in [`backend/.env.example`](./backend/.env.example); do not commit `.env` or put backend secrets in frontend variables.

The public API is mounted at `/api/v1`: it supports health checks, enquiries, published products, installation requests, published jobs and applications, published CMS pages, and public media retrieval. Admin APIs and authentication are not implemented. In development, Swagger UI and the OpenAPI document are available at `/api/docs` and `/api/openapi.json`. The full endpoint list and behavior are in [`backend/README.md`](./backend/README.md).

The frontend's [`.env.example`](./scarface-frontend/.env.example) sets `VITE_ENQUIRY_ENDPOINT=/api/v1/enquiries`. In development, [vite.config.js](./scarface-frontend/vite.config.js) proxies `/api` to `http://localhost:3001`. Start PostgreSQL and the backend before testing form submissions. In production, route `/api` to the backend or configure the frontend endpoint to the API's public URL.

## Configuration and integrations

### Enquiry endpoint

The form reads `VITE_ENQUIRY_ENDPOINT`. To enable sending:

1. From `scarface-frontend/`, copy `.env.example` to `.env`.
2. Set `VITE_ENQUIRY_ENDPOINT` to the URL of an API that accepts a JSON `POST` request.
3. Restart the Vite development server after changing the environment file.

Without this value, the form validates the fields and tells the visitor that no enquiry was sent. To send submissions to the backend included in this repository, use the endpoint shown in the frontend `.env.example` and start the backend.

Vite embeds variables prefixed with `VITE_` into client-side code. Do not put credentials, private API keys, or other secrets in these variables. Configure any privileged credentials on the server that receives the request.

## Where to make changes

| Change | File or directory |
|---|---|
| Brand name, tagline, hero copy, CTAs, contact details, social links | `src/data/brandData.js` |
| Desktop/mobile navigation labels, descriptions, links, section IDs | `src/data/navigationData.js` |
| Product descriptions, specifications, datasheet URL, model setting | `src/data/productData.js` |
| Image keys, charger views, gallery image mapping | `src/data/imageAssets.js` |
| Hero video/poster settings | `src/data/videoAssets.js` |
| Features, benefits, installation steps | `src/data/featuresData.js` |
| App showcase, gallery labels, FAQ, footer links, other page content | `src/data/contentData.js` |
| Shared design tokens, layout, responsive rules, animation styling | `src/styles/globals.css` |
| Page section composition and ordering | `src/pages/Home.jsx` |
| Shared page shell | `src/App.jsx` |

`ProductComparison` appears when a second product is added to `productData.js`. The datasheet section is conditional on a datasheet URL being configured. Check the relevant component before adding a new field so its expected data shape is preserved.

## Assets and media

- **Charger images:** Original extracted images used by the app are in `src/assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/`. The ZIP backup remains at the repository root.
- **Logo and favicon:** The logo is in `src/assets/logo/`; the favicon is `public/favicon.png`.
- **Hero image:** The current hero uses the existing illustrated asset. Add/import a replacement through `imageAssets.js` and keep any mobile crop mapping there.
- **Hero video:** Place authorized media in `src/assets/videos/`, import it in `videoAssets.js`, and configure a poster where appropriate. The current video fields are unset. Existing behavior skips video for mobile/reduced-motion users and avoids autoplay for Data Saver.
- **3D model:** `ChargerCanvas.jsx` supports a conceptual procedural charger and can load a GLB through its `modelUrl` prop. A model must be properly licensed and optimized. The homepage's current product viewer remains the image-based viewer.
- **Attribution:** Record media sources and licence checks in [`scarface-frontend/ATTRIBUTION.md`](./scarface-frontend/ATTRIBUTION.md).

Do not add externally sourced images, video, fonts, or models without checking the individual asset licence and documenting the source where required.

## Production and deployment

Run `npm run build` from `scarface-frontend/`; Vite writes deployable files to `scarface-frontend/dist/`. The Vite configuration uses `base: "./"` so generated asset URLs are relative and can work when hosted under a subdirectory. Deploy the contents of that `dist/` directory to a static host.

The frontend is a client-rendered single page deployed as static files. Deploy the backend separately and route `/api` to it, or configure `VITE_ENQUIRY_ENDPOINT` with the deployed API URL. See [`backend/README.md`](./backend/README.md) for backend deployment and configuration details.

## Content and release checklist

Before publishing:

- Replace product, feature, FAQ, vision/mission, and contact placeholders with verified information.
- Confirm every image, font, video, and model is authorized for use and update the attribution register.
- Configure and test the enquiry API if submissions should be sent.
- Test navigation, gallery/viewer controls, form validation, and responsive layouts on target browsers and screen sizes.
- Run `npm run build` and inspect the generated production site with `npm run preview`.
