import { useEffect, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import ContactForm from "./ContactForm";

export default function Overlays() {
  const [modal, setModal] = useState(false), [top, setTop] = useState(false), [cookie, setCookie] = useState(false);
  useEffect(() => {
    let c = null; try { c = localStorage.getItem("sev-cookie"); } catch {}
    if (!c) setCookie(true);
    const s = () => setTop(window.scrollY > 600), k = (e) => e.key === "Escape" && setModal(false);
    window.addEventListener("scroll", s, { passive: true }); window.addEventListener("keydown", k);
    return () => { window.removeEventListener("scroll", s); window.removeEventListener("keydown", k); };
  }, []);
  const choose = (v) => { try { localStorage.setItem("sev-cookie", v); } catch {} setCookie(false); };
  return (<>
    <div id="fab">{top && <button id="top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={20} /></button>}
      <button className="btn" onClick={() => setModal(true)}>Enquire</button></div>
    {modal && (<div id="modal" className="open" role="dialog" aria-modal="true" aria-label="Enquiry" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
      <div className="box"><button className="x" aria-label="Close" onClick={() => setModal(false)}><X /></button><h3 style={{ marginBottom: 16 }}>Send an enquiry</h3><ContactForm /></div></div>)}
    {cookie && (<div id="cookie" role="region" aria-label="Cookie preferences" style={{ display: "block" }}>
      We only use local storage to remember this choice. No analytics or advertising tracking is configured on this site.
      <div className="ctas"><button className="btn" onClick={() => choose("accepted")}>Accept</button><button className="btn ghost" onClick={() => choose("rejected")}>Reject</button><button className="btn ghost" onClick={() => choose("preferences")}>Preferences</button></div></div>)}
  </>);
}
