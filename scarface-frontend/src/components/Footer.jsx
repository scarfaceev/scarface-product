import { brand } from "../data/brandData";
import { footerLinks } from "../data/contentData";
import Logo from "./Logo";

const handleFooterLinkClick = (event, href) => {
  if (!href.startsWith("#faq-")) return;
  const item = document.getElementById(href.slice(1));
  const question = item?.querySelector("button");
  if (!item || !question) return;

  event.preventDefault();
  if (question.getAttribute("aria-expanded") !== "true") question.click();
  if (window.location.hash !== href) window.history.pushState(null, "", href);
  requestAnimationFrame(() => item.scrollIntoView({ block: "start" }));
};

export default function Footer() {
  const openPolicy = (policy) => (event) => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("scarface:open-policy", { detail: policy }));
  };

  return (<footer><div className="wrap"><div className="g"><div><Logo /><p className="footer-description">{brand.about}</p><div className="social-links">{brand.social.map((s) => <a key={s.label} className="social-link" href={s.href} aria-label={s.label} title={s.label}><img src={s.icon} alt="" /><span>{s.label}</span></a>)}</div></div>
    {Object.entries(footerLinks).map(([t, ls]) => <div key={t}><h4>{t}</h4>{ls.map(([l, h]) => <a key={l} href={h} onClick={(event) => handleFooterLinkClick(event, h)}>{l}</a>)}</div>)}</div>
    <div className="legal"><span>© {new Date().getFullYear()} {brand.name}. All rights reserved.</span><span><a href="#privacy-policy" onClick={openPolicy("privacy")}>Privacy policy</a><a href="#terms-and-conditions" onClick={openPolicy("terms")}>Terms and conditions</a></span></div></div></footer>);
}
