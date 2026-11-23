import { brand } from "../data/brandData";
import { footerLinks } from "../data/contentData";
import Logo from "./Logo";
export default function Footer() {
  return (<footer><div className="wrap"><div className="g"><div><Logo /><p style={{ maxWidth: 300 }}>{brand.about}</p><p>{brand.social.map((s) => <a key={s.label} href={s.href} style={{ display: "inline", marginRight: 14 }}>{s.label}</a>)}</p></div>
    {Object.entries(footerLinks).map(([t, ls]) => <div key={t}><h4>{t}</h4>{ls.map(([l, h]) => <a key={l} href={h}>{l}</a>)}</div>)}</div>
    <div className="legal"><span>© {new Date().getFullYear()} {brand.name}. All rights reserved.</span><span><a href="#">Privacy policy</a><a href="#">Terms and conditions</a></span></div></div></footer>);
}
