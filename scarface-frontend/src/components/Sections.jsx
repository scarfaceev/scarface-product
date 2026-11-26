import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Plus, X } from "lucide-react";
import { brand } from "../data/brandData";
import { products } from "../data/productData";
import { features, why, steps } from "../data/featuresData";
import { gallery, blog, faq, sustainChain } from "../data/contentData";
import Img from "./Img";
import Icon from "./Icon";
import Reveal from "./Reveal";
import ContactForm from "./ContactForm";

const Head = ({ eyebrow, title, lead, center }) => (<div style={center ? { textAlign: "center" } : null}><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{lead && <p className="lead" style={center ? { margin: "0 auto" } : null}>{lead}</p>}</div>);

export function ProductShowcase() {
  return (<section id="chargers"><div className="wrap">{products.map((p) => (
    <Reveal key={p.id} className="two" ><div className="art"><Img k={p.img} /></div>
      <div><div className="eyebrow">{p.category}</div><h2>{p.name}</h2><p className="lead">{p.desc}</p>
        <ul className="pts">{p.points.map((x) => <li key={x}>{x}</li>)}</ul><a className="btn" href={p.cta[1]}>{p.cta[0]}</a></div></Reveal>))}</div></section>);
}

export function Datasheet() {
  const p = products.find((x) => x.datasheet);
  if (!p) return null; // hidden until a real PDF path is supplied
  return (<section id="datasheet"><div className="wrap"><Head eyebrow="Datasheet" title={`${p.name} datasheet`} /><a className="btn" style={{ marginTop: 24 }} href={p.datasheet} download><Download size={18} /> Download PDF</a></div></section>);
}

export function Features() {
  return (<section id="features"><div className="wrap"><Reveal><Head eyebrow="Features" title="Built around you" lead="Edit each card to describe only capabilities your product actually supports." /></Reveal>
    <div className="grid">{features.map((f, i) => <Reveal key={f.title} delay={i * 0.05}><div className="card"><div className="ic"><Icon name={f.icon} /></div><h3>{f.title}</h3><p>{f.text}</p></div></Reveal>)}</div></div></section>);
}

export function WhyChoose() {
  return (<section className="dark" id="why"><div className="wrap two"><Reveal className="art"><Img k="why" /></Reveal>
    <Reveal delay={0.1}><Head eyebrow="Why choose us" title="Why ScarfaceEV" />{why.map(([t, d]) => <div className="spec" key={t} style={{ display: "block" }}><b>{t}</b><br /><span>{d}</span></div>)}</Reveal></div></section>);
}

export function Installation() {
  return (<section id="installation"><div className="wrap"><span id="services" className="anchor" /><Reveal><Head eyebrow="Services" title="Installation journey" /></Reveal>
    <div className="grid steps">{steps.map(([t, d], i) => <Reveal key={t} delay={i * 0.06}><div className="card"><h3>{t}</h3><p>{d}</p></div></Reveal>)}</div></div></section>);
}

export function ProductGallery() {
  const [idx, setIdx] = useState(null), [x0, setX0] = useState(null), n = gallery.length;
  useEffect(() => {
    if (idx === null) return;
    const k = (e) => { if (e.key === "Escape") setIdx(null); if (e.key === "ArrowRight") setIdx((idx + 1) % n); if (e.key === "ArrowLeft") setIdx((idx - 1 + n) % n); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [idx, n]);
  return (<section className="dark" id="gallery"><div className="wrap"><Reveal><Head eyebrow="Gallery" title="Product gallery" /></Reveal>
    <div className="gal">{gallery.map(([k, cap], i) => <button key={k} className="gi" onClick={() => setIdx(i)} aria-label={`Open ${cap}`}><Img k={k} /><span>{cap}</span></button>)}</div>
    {idx !== null && (<div className="lb" role="dialog" aria-modal="true" aria-label="Gallery" onClick={() => setIdx(null)} onTouchStart={(e) => setX0(e.touches[0].clientX)} onTouchEnd={(e) => { if (x0 === null) return; const d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 50) setIdx((idx + (d < 0 ? 1 : -1) + n) % n); setX0(null); }}>
      <button className="lx" aria-label="Close" onClick={() => setIdx(null)}><X /></button>
      <button className="ln1" aria-label="Previous" onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + n) % n); }}><ChevronLeft /></button>
      <figure onClick={(e) => e.stopPropagation()}><div className="art"><Img k={gallery[idx][0]} /></div><figcaption>{gallery[idx][1]}</figcaption></figure>
      <button className="ln2" aria-label="Next" onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % n); }}><ChevronRight /></button></div>)}</div></section>);
}

export function About() {
  return (<section id="about"><div className="wrap two"><Reveal><Head eyebrow="About" title="About ScarfaceEV" /><p className="about-copy">Scarface EV Solutions is a Hyderabad-based EV charging solutions company providing reliable and innovative charging systems for residential, commercial and public infrastructure.</p><p className="about-copy about-copy-secondary">Our solutions include AC chargers, DC fast chargers and home charging systems, helping drive smarter mobility and a sustainable future.</p><h2 className="about-tagline-heading">Scarface EV</h2><p className="about-tagline"><b>Build In Silence. Driven By Power</b></p></Reveal><Reveal className="art about-image-frame" delay={0.1}><Img k="about" /></Reveal></div></section>);
}

export function BlogSection() {
  return (<section className="dark" id="blog"><div className="wrap"><Reveal><Head eyebrow="Insights" title="Latest updates" lead="Sample placeholder content – replace with real articles." /></Reveal>
    <div className="grid">{blog.map(([k, cat, t, d], i) => <Reveal key={t} delay={i * 0.06}><article className="card bl"><div className="art"><Img k={k} /></div><small>{cat}</small><h3>{t}</h3><p>{d}</p></article></Reveal>)}</div></div></section>);
}

const faqAnchorId = (question) => `faq-${question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

export function FAQ() {
  const getLinkedQuestionIndex = (hash) => faq.findIndex(([question]) => `#${faqAnchorId(question)}` === hash);
  const [o, setO] = useState(() => {
    const linkedIndex = getLinkedQuestionIndex(window.location.hash);
    return linkedIndex === -1 ? 0 : linkedIndex;
  });
  useEffect(() => {
    const openQuestion = (hash) => {
      const linkedIndex = getLinkedQuestionIndex(hash);
      if (linkedIndex !== -1) setO(linkedIndex);
    };
    const handleHashChange = () => openQuestion(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);
  return (<section id="faq"><div className="wrap"><Reveal><Head center title="FAQ" /></Reveal>
    <div className="faq">{faq.map(([q, a], i) => (<div className="fi" id={faqAnchorId(q)} key={q}><button aria-expanded={o === i} onClick={() => setO(o === i ? null : i)}>{q}<Plus size={20} className={o === i ? "rot" : ""} /></button>
      <AnimatePresence initial={false}>{o === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}><p>{a}</p></motion.div>}</AnimatePresence></div>))}</div></div></section>);
}

export function FinalCTA() {
  return (<section className="cta dark" id="cta"><div className="wrap"><Reveal><h2>{brand.cta.title}</h2><p className="lead">{brand.cta.text}</p><div className="ctas"><a className="btn" href="#chargers">Explore Chargers</a><a className="btn ghost" href="#contact">Contact Us</a></div></Reveal></div></section>);
}

export function ContactSection() {
  const c = brand.contact;
  return (<section id="contact"><div className="wrap two"><Reveal><Head eyebrow="Contact" title="Let’s talk" lead="Tell us what you need and our team will get back to you." /><p>✉ {c.email}<br />☎ {c.phone}<br />⌂ {c.address}</p></Reveal><Reveal delay={0.1}><ContactForm /></Reveal></div></section>);
}

export function Sustainability() {
  return (<section className="dark sust" id="sustainability"><div className="sbg"><Img k="landscape" /><div className="shade2" /></div>
    <div className="wrap" style={{ position: "relative" }}><Reveal><Head eyebrow="Sustainable mobility" title="From landscapes to charging" lead="Electric mobility is part of the move toward cleaner transport. This is where ScarfaceEV fits in." /></Reveal>
      <ol className="chain">{sustainChain.map(([t, d], i) => <Reveal key={t} delay={i * 0.07}><li><b>{t}</b><span>{d}</span></li></Reveal>)}</ol></div></section>);
}
