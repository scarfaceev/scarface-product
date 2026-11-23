# ScarfaceEV frontend (React + Vite)

## Run

From this directory:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Requires Node 18+. The production build is written to `dist/` within this folder. Vite uses relative asset paths so the build can be hosted from a subdirectory.

## Where to change things

| What | File |
|---|---|
| Logo | `src/assets/logo/logo-removebg-preview.png`; favicon: `public/favicon.png` |
| Hero text, CTAs, contact details, social links, tagline | `src/data/brandData.js` |
| Navigation + mega menus | `src/data/navigationData.js` |
| Site images and gallery configuration | `src/data/imageAssets.js` |
| Original charger photos | `src/assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/`; mappings are in `src/data/imageAssets.js` |
| Hero video | Place media in `src/assets/videos/` and configure `src/data/videoAssets.js` |
| Product information and datasheet | `src/data/productData.js` |
| Features and installation steps | `src/data/featuresData.js` |
| App screens, gallery, blog, FAQ, footer links | `src/data/contentData.js` |
| Colours and fonts | CSS variables at the top of `src/styles/globals.css` |

## Enquiry form

The form validates locally by default and does not send anything. To connect an API/CRM endpoint, copy `.env.example` to `.env` and set `VITE_ENQUIRY_ENDPOINT` to the URL that accepts the JSON POST. Do not put secrets in `VITE_` variables because they are exposed in frontend builds.

## 3D product viewer

`src/components/ChargerCanvas.jsx` renders a conceptual procedural charger (labelled "Conceptual product visual"). To use a real model, put a GLB in `src/assets/models/` and set `model3d` in `src/data/productData.js`. Scale and centre the model in your 3D tool (about 2 units tall). The badge disappears when a model is configured. If WebGL is unavailable or errors, a lightweight CSS-3D version is shown. The existing image-based charger viewer and its automatic rotation are retained.

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
