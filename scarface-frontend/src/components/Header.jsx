import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowRight, Plus, Minus } from "lucide-react";
import { nav } from "../data/navigationData";
import Logo from "./Logo";

export default function Header() {
  const [cur, setCur] = useState(null), [last, setLast] = useState(0), [mob, setMob] = useState(false);
  const [openSub, setOpenSub] = useState(null), [scrolled, setScrolled] = useState(false), [active, setActive] = useState("home");
  const t = useRef();
  const show = (i) => { clearTimeout(t.current); setCur(i); setLast(i); };
  const hide = () => { t.current = setTimeout(() => setCur(null), 180); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    const onKey = (e) => { if (e.key === "Escape") { setCur(null); setMob(false); } };
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); };
  }, []);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-40% 0px -50% 0px" });
    nav.flatMap((n) => n.spy).forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  const m = nav[last];
  return (
    <header id="hd" className={scrolled ? "s" : ""} onMouseLeave={hide} onMouseEnter={() => clearTimeout(t.current)}>
      <div className="bar">
        <Logo showName />
        <nav className="d" aria-label="Primary">
          {nav.map((n, i) => (
            <div className="nav-item" key={n.label} onMouseEnter={() => show(i)} onMouseLeave={() => hide()}>
              <button aria-haspopup="true" aria-expanded={cur === i}
                className={(cur === i ? "on " : "") + (cur === null && n.spy.includes(active) ? "cur" : "")}
                onFocus={() => show(i)}
                onClick={() => { window.location.hash = n.links[0][1].slice(1); setCur(null); }}>{n.label}</button>
              {cur === i && (
                <div id="mega" className={`open${n.label === "Services" ? " service-menu" : ""}`} aria-hidden={false}>
                  <div>
                    <h3>{n.title}</h3><p>{n.desc}</p>
                    <div className="ls">{n.links.map(([l, h]) => <a key={l} href={h} onClick={() => setCur(null)}>{l}<ArrowRight size={14} /></a>)}</div>
                    <a className="btn sm" href={n.cta[1]} onClick={() => setCur(null)}>{n.cta[0]} <ArrowRight size={14} /></a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
        <button className="burger" aria-label={mob ? "Close menu" : "Open menu"} aria-expanded={mob} onClick={() => setMob(!mob)}>{mob ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      <div id="mob" className={mob ? "open" : ""}>
        {nav.map((n, i) => (
          <div key={n.label}>
            <button aria-expanded={openSub === i} onClick={() => setOpenSub(openSub === i ? null : i)}>{n.label}{openSub === i ? <Minus size={18} /> : <Plus size={18} />}</button>
            <div className={"sub" + (openSub === i ? " open" : "")}>{n.links.map(([l, h]) => <a key={l} href={h} onClick={() => setMob(false)}>{l}</a>)}</div>
          </div>
        ))}
      </div>
    </header>
  );
}
