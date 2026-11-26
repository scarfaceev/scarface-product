import { useEffect, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import ContactForm from "./ContactForm";

export default function Overlays({ policyOnly = false } = {}) {
  const [modal, setModal] = useState(false), [policy, setPolicy] = useState(null), [top, setTop] = useState(false), [cookie, setCookie] = useState(false);
  useEffect(() => {
    let c = null; try { c = localStorage.getItem("sev-cookie"); } catch {}
    if (!c) setCookie(true);
    const s = () => setTop(window.scrollY > 600);
    const k = (e) => {
      if (e.key === "Escape") {
        setModal(false);
        setPolicy(null);
      }
    };
    const openPolicy = (e) => setPolicy(e.detail);
    window.addEventListener("scroll", s, { passive: true }); window.addEventListener("keydown", k);
    window.addEventListener("scarface:open-policy", openPolicy);
    return () => {
      window.removeEventListener("scroll", s);
      window.removeEventListener("keydown", k);
      window.removeEventListener("scarface:open-policy", openPolicy);
    };
  }, []);
  const choose = (v) => { try { localStorage.setItem("sev-cookie", v); } catch {} setCookie(false); };
  return (<>
    {!policyOnly && <div id="fab">{top && <button id="top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={20} /></button>}
      <button className="btn" onClick={() => setModal(true)}>Enquire</button></div>}
    {!policyOnly && modal && (<div id="modal" className="open" role="dialog" aria-modal="true" aria-label="Enquiry" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
      <div className="box"><button className="x" aria-label="Close" onClick={() => setModal(false)}><X /></button><h3 style={{ marginBottom: 16 }}>Send an enquiry</h3><ContactForm /></div></div>)}
    {policy && (<div id="policy-modal" className="open" role="dialog" aria-modal="true" aria-label={policy === "privacy" ? "Privacy Policy" : "Terms & Conditions"} onClick={(e) => e.target === e.currentTarget && setPolicy(null)}>
      <article className="privacy-box">
        <button className="x" aria-label="Close policy" onClick={() => setPolicy(null)}><X /></button>
        <p className="privacy-kicker">{policy === "privacy" ? "Privacy Policy" : "Terms & Conditions"}</p>
        <h2>{policy === "privacy" ? "Privacy Policy" : "Terms & Conditions"}</h2>
        {policy === "privacy" ? <div className="privacy-content">
          <p>Scarface EV Solutions values your privacy and is committed to protecting your personal information. By registering on our website, you acknowledge the following privacy practices:</p>
          <section>
            <h3>1. Information Collection</h3>
            <p>We collect personal details such as your name, email address, phone number and other information provided during registration.</p>
          </section>
          <section>
            <h3>2. Use of Information</h3>
            <p>Your information may be used to manage your account, respond to enquiries, process service requests and provide EV charging solutions.</p>
          </section>
          <section>
            <h3>3. Data Protection</h3>
            <p>We take reasonable security measures to protect your personal information against unauthorized access, misuse, loss or disclosure.</p>
          </section>
          <section>
            <h3>4. Information Sharing</h3>
            <p>We do not sell your personal information. Information may be shared with authorised service providers or disclosed when legally required.</p>
          </section>
          <section>
            <h3>5. Cookies &amp; Website Usage</h3>
            <p>Our website may use cookies and similar technologies to improve website functionality, user experience and performance.</p>
          </section>
          <section>
            <h3>6. User Rights &amp; Contact</h3>
            <p>You may request access, correction or deletion of your personal information, subject to applicable laws. For privacy-related questions or requests, contact us at <a href="mailto:info@scarfaceev.com">info@scarfaceev.com</a>.</p>
          </section>
        </div> : <div className="privacy-content">
          <section>
            <h3>1. Accurate Information</h3>
            <p>Users must provide genuine, complete and up-to-date information during registration.</p>
          </section>
          <section>
            <h3>2. Account Security</h3>
            <p>Users are responsible for maintaining password confidentiality and protecting their accounts from unauthorized access.</p>
          </section>
          <section>
            <h3>3. Responsible Usage</h3>
            <p>Users must use the website and services lawfully and must not engage in fraudulent activities or misuse company services.</p>
          </section>
          <section>
            <h3>4. Products &amp; Services</h3>
            <p>Product specifications, pricing, availability, installation and technical support are subject to applicable company policies and service conditions.</p>
          </section>
          <section>
            <h3>5. Privacy &amp; Data Protection</h3>
            <p>Personal information will be collected and processed in accordance with our Privacy Policy and applicable data protection laws.</p>
          </section>
          <section>
            <h3>6. Terms Acceptance</h3>
            <p>By creating an account, users confirm that they have read, understood and agreed to these Terms &amp; Conditions and the Privacy Policy.</p>
          </section>
        </div>}
        <div className="privacy-actions">
          <button type="button" className="privacy-done" onClick={() => setPolicy(null)}>Done</button>
        </div>
      </article>
    </div>)}
    {!policyOnly && cookie && (<div id="cookie" role="region" aria-label="Cookie preferences" style={{ display: "block" }}>
      We only use local storage to remember this choice. No analytics or advertising tracking is configured on this site.
      <div className="ctas"><button className="btn" onClick={() => choose("accepted")}>Accept</button><button className="btn ghost" onClick={() => choose("rejected")}>Reject</button><button className="btn ghost" onClick={() => choose("preferences")}>Preferences</button></div></div>)}
  </>);
}
