import { useState } from "react";
import { images } from "../data/imageAssets";
import sceneUrl from "../assets/images/Hero_section_image.png";

function Illustration({ hue, alt }) {
  const id = `g${hue}`;
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label={alt}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={`hsl(${hue},60%,14%)`} /><stop offset="1" stopColor={`hsl(${hue},45%,26%)`} /></linearGradient></defs>
      <rect width="400" height="400" fill={`url(#${id})`} /><circle cx="300" cy="110" r="150" fill="#19B5A5" opacity=".12" />
      <rect y="330" width="400" height="70" fill="#0b1117" /><rect x="140" y="70" width="120" height="210" rx="26" fill="#F7F9F8" />
      <rect x="154" y="88" width="92" height="74" rx="14" fill="#101820" /><path d="M205 100l-22 34h18l-6 22 26-38h-18z" fill="#19B5A5" />
      <circle cx="200" cy="196" r="7" fill="#72D8C5" /><rect x="164" y="226" width="72" height="8" rx="4" fill="#d3dcd9" />
      <path d="M200 280c0 40 60 30 70 60" stroke="#72D8C5" strokeWidth="8" fill="none" strokeLinecap="round" /><rect x="258" y="332" width="34" height="14" rx="6" fill="#19B5A5" />
    </svg>
  );
}

/** Renders images[k]: real photo (with mobile variant + fallback) or a built-in illustration. */
export default function Img({ k, eager = false, className = "" }) {
  const cfg = images[k];
  const [bad, setBad] = useState(false);
  if (cfg.src && !bad) {
    return (
      <picture>
        {cfg.mobileSrc && <source media="(max-width:760px)" srcSet={cfg.mobileSrc} />}
        <img className={className} src={cfg.src} alt={cfg.alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setBad(true)} />
      </picture>
    );
  }
  if (cfg.scene === "hero") return <img className={className} src={sceneUrl} alt={cfg.alt} loading={eager ? "eager" : "lazy"} />;
  if (cfg.scene === "landscape") return (<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label={cfg.alt}><defs><linearGradient id="ls" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#13303a" /><stop offset="1" stopColor="#0b1117" /></linearGradient></defs><rect width="400" height="400" fill="url(#ls)" /><path d="M0 260L90 150l60 80 70-110 90 130 90-70v220H0z" fill="#1c3a44" /><path d="M0 310l110-80 80 60 90-70 120 90v90H0z" fill="#142830" /></svg>);
  return <Illustration hue={cfg.hue} alt={cfg.alt} />;
}
