import { useState } from "react";
import { brand } from "../data/brandData";

const endpoint = import.meta.env.VITE_ENQUIRY_ENDPOINT || "/api/v1/enquiries";
const F = ({ n, label, err, ...p }) => (<label>{label}<input name={n} aria-invalid={!!err[n]} {...p} /><span className="err">{err[n]}</span></label>);

export default function ContactForm() {
  const [err, setErr] = useState({}), [msg, setMsg] = useState("");
  const submit = async (ev) => {
    ev.preventDefault();
    const form = ev.currentTarget, f = new FormData(form), v = (k) => (f.get(k) || "").toString().trim(), er = {};
    if (!v("name")) er.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) er.email = "Enter a valid email.";
    if (v("phone") && !/^[+\d][\d\s()-]{6,}$/.test(v("phone"))) er.phone = "Enter a valid phone number.";
    if (v("message").length < 10) er.message = "Please write at least 10 characters.";
    setErr(er); setMsg("");
    if (Object.keys(er).length) return;
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(f)) });
      if (!r.ok) throw new Error();
      setMsg("Thanks – your enquiry has been received. Our team will get back to you."); form.reset();
    } catch { setMsg("Our enquiry service is temporarily unavailable. Please try again later."); }
  };
  return (
    <form noValidate onSubmit={submit}>
      <F err={err} n="name" label="Name" autoComplete="name" /><F err={err} n="email" label="Email" type="email" autoComplete="email" /><F err={err} n="phone" label="Phone" type="tel" autoComplete="tel" />
      <label>Interested in<select name="interest">{brand.interests.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>Message<textarea name="message" rows="4" aria-invalid={!!err.message} /><span className="err">{err.message}</span></label>
      <button className="btn" type="submit">Send enquiry</button>
      <div aria-live="polite">{msg && <div className="ok">{msg}</div>}</div>
    </form>
  );
}
