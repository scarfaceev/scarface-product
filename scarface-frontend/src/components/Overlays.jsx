import { useEffect, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import ContactForm from "./ContactForm";

export default function Overlays() {
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
    <div id="fab">{top && <button id="top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={20} /></button>}
      <button className="btn" onClick={() => setModal(true)}>Enquire</button></div>
    {modal && (<div id="modal" className="open" role="dialog" aria-modal="true" aria-label="Enquiry" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
      <div className="box"><button className="x" aria-label="Close" onClick={() => setModal(false)}><X /></button><h3 style={{ marginBottom: 16 }}>Send an enquiry</h3><ContactForm /></div></div>)}
    {policy && (<div id="policy-modal" className="open" role="dialog" aria-modal="true" aria-label={policy === "privacy" ? "Privacy Policy" : "Terms & Conditions"} onClick={(e) => e.target === e.currentTarget && setPolicy(null)}>
      <article className="privacy-box">
        <button className="x" aria-label="Close policy" onClick={() => setPolicy(null)}><X /></button>
        <p className="privacy-kicker">{policy === "privacy" ? "Privacy Policy" : "Terms & Conditions"}</p>
        <h2>{policy === "privacy" ? "Privacy Policy" : "Terms & Conditions"}</h2>
        {policy === "privacy" ? <div className="privacy-content">
          <section>
            <h3>1. Introduction</h3>
            <p>Welcome to Sacrface Ev.</p>
            <p>At Sacrface Ev, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store and protect your personal information when you visit our website or use our services.</p>
            <p>By accessing our website, you acknowledge that you have read this Privacy Policy.</p>
          </section>
          <section>
            <h3>2. Information We Collect</h3>
            <p>We may collect the following categories of personal information:</p>
            <ul>
              <li>Personal details such as your name.</li>
              <li>Contact details such as your email address and mobile number.</li>
              <li>Business information and company details, where applicable.</li>
              <li>Location and installation-site information provided by you.</li>
              <li>Enquiry details and communication records.</li>
              <li>Technical information such as IP address, browser type and website usage data.</li>
            </ul>
          </section>
          <section>
            <h3>3. Use of Personal Information</h3>
            <p>We may use your personal information for the following purposes:</p>
            <ul>
              <li>To respond to customer enquiries.</li>
              <li>To provide EV charging products and services.</li>
              <li>To process service and installation requests.</li>
              <li>To provide customer support and technical assistance.</li>
              <li>To communicate product updates and promotional offers, where permitted.</li>
              <li>To improve our website and services.</li>
              <li>To maintain business records and prevent fraudulent activities.</li>
            </ul>
          </section>
          <section>
            <h3>4. Sharing of Personal Information</h3>
            <p>We do not sell your personal information.</p>
            <p>We may share information with authorised service providers, business partners or other parties when necessary to provide our services, fulfil legal obligations or protect our legitimate business interests, subject to applicable law.</p>
          </section>
          <section>
            <h3>5. Data Security</h3>
            <p>We implement appropriate technical and organisational security measures to protect your personal information against unauthorised access, disclosure, alteration or destruction.</p>
            <p>These measures may include encryption, secure communication protocols and access controls.</p>
            <p>However, no method of internet transmission or electronic storage is completely secure.</p>
          </section>
          <section>
            <h3>6. Data Retention</h3>
            <p>We retain personal information only for as long as necessary to fulfil the purposes for which it was collected, comply with applicable legal requirements and resolve disputes.</p>
          </section>
          <section>
            <h3>7. Your Privacy Rights</h3>
            <p>Subject to applicable law, you may have rights regarding your personal information, including:</p>
            <ul>
              <li>Right to access information about your personal data.</li>
              <li>Right to correction and erasure of personal data.</li>
              <li>Right to grievance redressal.</li>
              <li>Right to nominate another individual to exercise your rights.</li>
            </ul>
            <p>You may contact our Grievance Officer to submit a privacy-related request or complaint.</p>
          </section>
          <section>
            <h3>8. Grievance Redressal</h3>
            <p>In accordance with applicable data protection laws, including the Digital Personal Data Protection Act, 2023, and applicable rules, individuals may contact our Grievance Officer regarding concerns about the processing of their personal information.</p>
            <address>
              <strong>Designation:</strong> Grievance Officer<br />
              <strong>Company:</strong> Sacrface Ev<br />
              <strong>Address:</strong> Plot No. 198, Maktha, Korremula Road, Ghatkesar, Medchal-Malkajgiri, Telangana – 500088.<br />
              <strong>Email:</strong> <a href="mailto:info@scarfaceev.com">info@scarfaceev.com</a>
            </address>
            <p>We will acknowledge and address complaints within the timelines prescribed under applicable law.</p>
          </section>
          <section>
            <h3>9. Policy Updates</h3>
            <p>Sacrface Ev reserves the right to update this Privacy Policy from time to time. Any changes will be published on our website.</p>
          </section>
          <section>
            <h3>10. Contact Us</h3>
            <p>For questions or concerns regarding this Privacy Policy, please contact:</p>
            <address>
              <strong>Sacrface Ev</strong><br />
              <strong>Phone:</strong> <a href="tel:+918639056787">8639056787</a><br />
              <strong>Email:</strong> <a href="mailto:info@scarfaceev.com">info@scarfaceev.com</a>
            </address>
          </section>
        </div> : <div className="privacy-content">
          <section>
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing or using the Sacrface Ev website, you agree to comply with these Terms &amp; Conditions. If you do not agree, please discontinue using our website.</p>
          </section>
          <section>
            <h3>2. Products and Services</h3>
            <p>Sacrface Ev provides AC chargers, DC fast chargers, residential and commercial EV charging solutions, installation, maintenance and technical support.</p>
          </section>
          <section>
            <h3>3. Enquiries and Quotations</h3>
            <p>Customers can submit enquiries through our website or official communication channels. Quotations will be provided based on customer requirements, product availability and site feasibility. Submitting an enquiry does not confirm an order.</p>
          </section>
          <section>
            <h3>4. Pricing and Payments</h3>
            <p>Product prices, applicable taxes, installation charges and payment terms will be communicated through official quotations. Payments must be made through authorised company payment methods.</p>
          </section>
          <section>
            <h3>5. Order Confirmation</h3>
            <p>Orders will be confirmed only after quotation acceptance and completion of the required formalities. Any changes to confirmed orders must be mutually agreed upon.</p>
          </section>
          <section>
            <h3>6. Installation and Site Requirements</h3>
            <p>Installation is subject to site inspection and technical feasibility. Customers must ensure suitable electrical infrastructure and provide necessary access to the installation location. Additional electrical or civil work may involve extra charges.</p>
          </section>
          <section>
            <h3>7. Warranty and Maintenance</h3>
            <p>Warranty coverage and duration depend on the selected product and applicable warranty terms. Technical support and maintenance will be provided according to the agreed service conditions.</p>
          </section>
          <section>
            <h3>8. Cancellation and Refunds</h3>
            <p>Cancellation and refund requests must be submitted through official company communication channels. Refund eligibility and applicable deductions will depend on the order status and agreed refund policy.</p>
          </section>
          <section>
            <h3>9. Limitation of Liability</h3>
            <p>Sacrface Ev shall take reasonable measures to provide reliable products and services. The company shall not be responsible for damages resulting from improper usage, unauthorised modifications or circumstances beyond its reasonable control, subject to applicable law.</p>
          </section>
          <section>
            <h3>10. Governing Law and Contact Information</h3>
            <p>These Terms &amp; Conditions shall be governed by the applicable laws of India. Any disputes shall be subject to the jurisdiction of competent courts in Telangana, subject to applicable law.</p>
            <p>For questions or concerns, contact:</p>
            <address>
              <strong>Company:</strong> Sacrface Ev<br />
              <strong>Email:</strong> <a href="mailto:info@scarfaceev.com">info@scarfaceev.com</a><br />
              <strong>Phone:</strong> <a href="tel:+918639056787">8639056787</a><br />
              <strong>Address:</strong> Plot No. 198, Maktha, Korremula Road, Ghatkesar, Medchal-Malkajgiri, Telangana – 500088.
            </address>
          </section>
        </div>}
      </article>
    </div>)}
    {cookie && (<div id="cookie" role="region" aria-label="Cookie preferences" style={{ display: "block" }}>
      We only use local storage to remember this choice. No analytics or advertising tracking is configured on this site.
      <div className="ctas"><button className="btn" onClick={() => choose("accepted")}>Accept</button><button className="btn ghost" onClick={() => choose("rejected")}>Reject</button><button className="btn ghost" onClick={() => choose("preferences")}>Preferences</button></div></div>)}
  </>);
}
