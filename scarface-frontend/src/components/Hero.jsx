import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { brand } from "../data/brandData";
import { heroVideo } from "../data/videoAssets";
import { images } from "../data/imageAssets";
import Img from "./Img";

export default function Hero() {
  const reduce = useReducedMotion(), vref = useRef(), sec = useRef(), h = brand.hero;
  const heroCtas = h.ctas ?? [];
  const small = typeof window !== "undefined" && window.matchMedia("(max-width:760px)").matches;
  const saveData = typeof navigator !== "undefined" && navigator.connection?.saveData;
  const src = small ? heroVideo.mobileSrc : heroVideo.src;
  const [failed, setFailed] = useState(false);
  const useVideo = !!src && !reduce && !saveData && !failed; // otherwise: poster / photo only
  const [playing, setPlaying] = useState(true);
  const { scrollYProgress } = useScroll({ target: sec, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "16%"]);
  const ty = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -50]);
  useEffect(() => { const v = vref.current; if (!v) return; if (playing) v.play().catch(() => setPlaying(false)); else v.pause(); }, [playing, useVideo]);
  const poster = heroVideo.poster || images.hero.src || undefined;
  return (
    <section className="hero2" id="home" ref={sec}>
      <motion.div className="hbg" style={{ y }}>
        {useVideo ? (
          <video ref={vref} muted loop playsInline autoPlay preload="metadata" poster={poster} onError={() => setFailed(true)} aria-hidden="true">
            {!small && heroVideo.webm && <source src={heroVideo.webm} type="video/webm" />}<source src={src} type="video/mp4" />
          </video>
        ) : (
          <motion.div className="kb" animate={reduce ? undefined : { scale: [1, 1.07] }} transition={{ duration: 18, repeat: Infinity, repeatType: "reverse", ease: "linear" }}><Img k="hero" eager /></motion.div>
        )}
        <div className="shade" />
      </motion.div>
      <motion.div className="wrap hc" style={{ y: ty }}>
        <motion.div className={heroCtas.length ? "hero-copy" : "hero-copy hero-copy--no-ctas"} initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <h1>{h.title[0]}<br /><span>{h.title[1]}</span></h1>
          <p>{h.text}</p>
          {heroCtas.length > 0 && <div className="ctas">{heroCtas.map((c, i) => <a key={c.label} className={"btn" + (i ? " ghost" : "")} href={c.href}>{c.label}</a>)}</div>}
        </motion.div>
      </motion.div>
      <div className="hfoot wrap">{heroVideo.caption && <span>{heroVideo.caption}</span>}
        {useVideo && <button className="pp" aria-label={playing ? "Pause video" : "Play video"} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>}
      </div>
    </section>
  );
}
