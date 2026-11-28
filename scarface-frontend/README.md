# ScarfaceEV frontend (React + Vite)

## Run

From this directory:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Requires Node 20+ (the backend requires Node 20+). The production build is written to `dist/` within this folder. Vite uses relative asset paths so the build can be hosted from a subdirectory.

The backend runs separately from [../backend/](../backend/). All frontend API requests use `VITE_API_BASE_URL`, which defaults to the same-origin `/api` path. Vite proxies `/api` to `http://localhost:3001` during development. For Vercel, set `VITE_API_BASE_URL` to the public Render backend origin and allow the Vercel origin in backend CORS settings.

For Vercel, configure the project root as `scarface-frontend`, build command as `npm run build`, and output directory as `dist`. The project builds multiple explicit HTML pages, so no SPA fallback rewrite is needed.

## Where to change things

| What | File |
|---|---|
| Logo and favicon | `src/assets/logo/logo-removebg-preview.png` |
| Hero text, CTAs, contact details, social links, tagline | `src/data/brandData.js` |
| Navigation + mega menus | `src/data/navigationData.js` |
| Site images and gallery configuration | `src/data/imageAssets.js` |
| Charger photos | `src/assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/`; product, gallery, and viewer mappings are in `src/data/imageAssets.js` |
| Hero video | Place media in `src/assets/videos/` and configure `src/data/videoAssets.js` |
| Product information and datasheet | `src/data/productData.js` |
| Features and installation steps | `src/data/featuresData.js` |
| App screens, gallery, blog, FAQ, footer links | `src/data/contentData.js` |
| Colours and fonts | CSS variables at the top of `src/styles/globals.css` |

## Enquiry form

The form submits the name, email, phone, interest, and message to the API. Configure the backend email provider, `EMAIL_FROM`, and `ENQUIRY_RECEIVER_EMAIL` in the backend environment to deliver the enquiry email; see [../backend/README.md](../backend/README.md). Backend credentials must never be placed in `VITE_` variables because they are exposed in frontend builds.

## Product photo viewer

`src/components/Product3DViewer.jsx` rotates through the supplied front, angled, and rear DC charger photos; it supports dragging, angle selection, and zoom. This is a photo-based turntable, not a true 3D model.

## Hero photo and video

The site ships with an original illustrated hero. To use real media:

1. Save a licensed photo in `src/assets/images/`, import it in `src/data/imageAssets.js`, and set `images.hero.src` (and `mobileSrc` for a portrait crop).
2. Choose a licensed, short, muted MP4 (ideally under 8 MB), put it in `src/assets/videos/`, import it in `src/data/videoAssets.js`, and set `src` (plus optional `poster` and `webm`).
3. Check each media file's licence and record its source in [`ATTRIBUTION.md`](./ATTRIBUTION.md). Avoid clips where another company's charger or logo is prominent.

The hero skips video on mobile and for reduced-motion users; it uses a poster image instead. It also avoids autoplay for Data Saver users.

For licensed media inspiration, search Pexels/Pixabay for "electric car charging" or "home EV charger". Check the licence on each individual source page before use.

### Hero media pipeline

Compress licensed footage (requires `ffmpeg`), then reference the generated files in `src/data/videoAssets.js`:

```bash
ffmpeg -i in.mp4 -an -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 26 -preset slow -movflags +faststart src/assets/videos/hero.mp4
ffmpeg -i in.mp4 -an -vf "scale=1920:-2,fps=30" -c:v libvpx-vp9 -crf 34 -b:v 0 src/assets/videos/hero.webm
ffmpeg -i in.mp4 -an -vf "scale=960:-2,fps=24" -c:v libx264 -crf 28 -movflags +faststart src/assets/videos/hero-mobile.mp4
ffmpeg -i in.mp4 -frames:v 1 -vf scale=1920:-2 src/assets/images/hero-poster.webp
```

## Content

Specifications, features, FAQ answers, vision/mission, blog posts, and contact details may be placeholders ("To be confirmed"). Replace them with verified information before launch. Media credits and licence status are tracked in [`ATTRIBUTION.md`](./ATTRIBUTION.md).
