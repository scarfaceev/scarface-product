import { useRef, useState } from "react";
import { brand } from "../data/brandData";
import { apiUrl } from "../utils/auth-api.js";

const endpoint = apiUrl("/api/v1/enquiries");
const F = ({ n, label, err, ...p }) => (<label>{label}<input name={n} aria-invalid={!!err[n]} {...p} /><span className="err">{err[n]}</span></label>);

export default function ContactForm() {
  const [err, setErr] = useState({}), [msg, setMsg] = useState(""), [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const submit = async (ev) => {
    ev.preventDefault();
    if (submittingRef.current) return;
    const form = ev.currentTarget, f = new FormData(form), v = (k) => (f.get(k) || "").toString().trim(), er = {};
    if (!v("name")) er.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) er.email = "Enter a valid email.";
    if (v("phone") && !/^[+\d][\d\s()-]{6,}$/.test(v("phone"))) er.phone = "Enter a valid phone number.";
    if (!v("interest")) er.interest = "Please select an enquiry category.";
    if (v("message").length < 10) er.message = "Please write at least 10 characters.";
    setErr(er); setMsg("");
    if (Object.keys(er).length) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(f)) });
      if (!r.ok) {
        const payload = await r.json().catch(() => null);
        const serverMessage = payload?.error?.message;
        setMsg(typeof serverMessage === "string" ? serverMessage : "We couldn't submit your enquiry right now. Please try again later.");
        return;
      }
      setMsg("Thanks – your enquiry has been received. Our team will get back to you."); form.reset();
    } catch { setMsg("We couldn't submit your enquiry right now. Please try again later."); }
    finally { submittingRef.current = false; setSubmitting(false); }
  };
  return (
    <form noValidate onSubmit={submit} aria-busy={submitting}>
      <F err={err} n="name" label="Name" autoComplete="name" required /><F err={err} n="email" label="Email" type="email" autoComplete="email" required /><F err={err} n="phone" label="Phone" type="tel" autoComplete="tel" />
      <label>Interested in<select name="interest" required aria-invalid={!!err.interest}>{brand.interests.map((x) => <option key={x}>{x}</option>)}</select><span className="err">{err.interest}</span></label>
      <label>Message<textarea name="message" rows="4" aria-invalid={!!err.message} required /><span className="err">{err.message}</span></label>
      <button className="btn" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send enquiry"}</button>
      <div aria-live="polite">{msg && <div className={msg.startsWith("Thanks") ? "ok" : "err"} role="status">{msg}</div>}</div>
    </form>
  );
}
