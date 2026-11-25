import { brand } from "../data/brandData";
import { footerLinks } from "../data/contentData";
import Logo from "./Logo";
export default function Footer() {
  const openPrivacyPolicy = (event) => {
    event.preventDefault();
    window.dispatchEvent(new Event("scarface:open-privacy-policy"));
  };

  return (<footer><div className="wrap"><div className="g"><div><Logo /><p className="footer-description">{brand.about}</p><div className="social-links">{brand.social.map((s) => <a key={s.label} className="social-link" href={s.href} aria-label={s.label} title={s.label}><img src={s.icon} alt="" /><span>{s.label}</span></a>)}</div></div>
    {Object.entries(footerLinks).map(([t, ls]) => <div key={t}><h4>{t}</h4>{ls.map(([l, h]) => <a key={l} href={h}>{l}</a>)}</div>)}</div>
    <div className="legal"><span>© {new Date().getFullYear()} {brand.name}. All rights reserved.</span><span><a href="#privacy-policy" onClick={openPrivacyPolicy}>Privacy policy</a><a href="#">Terms and conditions</a></span></div></div></footer>);
}
