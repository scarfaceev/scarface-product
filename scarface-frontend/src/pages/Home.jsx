import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Hero from "../components/Hero";
import { ProductShowcase, Features, WhyChoose, Installation, ProductGallery, Datasheet, FAQ, FinalCTA, ContactSection, About, Sustainability } from "../components/Sections";
import { authApiUrl } from "../utils/auth-api.js";
const Product3DViewer = lazy(() => import("../components/Product3DViewer"));
export default function Home() {
  const mainRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRestrictedArea, setIsRestrictedArea] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(authApiUrl("me"), { credentials: "include" })
      .then((response) => {
        if (!active) return;
        setIsAuthenticated(response.ok);
        if (!response.ok && response.status !== 401) {
          console.error(`Unable to verify the current session (HTTP ${response.status}).`);
        }
      })
      .catch((error) => {
        if (!active) return;
        console.error("Unable to verify the current session.", error);
        setIsAuthenticated(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return undefined;

    const updateRestriction = () => {
      const sections = Array.from(main.children).filter((child) => child.tagName === "SECTION");
      sections.forEach((section, index) => {
        section.inert = !isAuthenticated && index >= 3;
      });
      const footer = document.querySelector("footer");
      if (footer) footer.inert = !isAuthenticated;

      if (isAuthenticated || !main.querySelector("#viewer") || !sections[3]) {
        setIsRestrictedArea(false);
        return;
      }

      const boundary = sections[3].getBoundingClientRect().top + window.scrollY;
      setIsRestrictedArea(window.scrollY >= boundary);
    };

    const observer = new MutationObserver(updateRestriction);
    observer.observe(main, { childList: true, subtree: true });
    window.addEventListener("scroll", updateRestriction, { passive: true });
    window.addEventListener("resize", updateRestriction);
    updateRestriction();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateRestriction);
      window.removeEventListener("resize", updateRestriction);
      const footer = document.querySelector("footer");
      if (footer) footer.inert = false;
    };
  }, [isAuthenticated]);

  return (
    <>
      <main
        ref={mainRef}
        className={!isAuthenticated ? "login-restriction-active" : undefined}
      >
        <Hero /><ProductShowcase />
        <Suspense fallback={null}><Product3DViewer /></Suspense>
        <Datasheet /><Features /><Sustainability />
        <WhyChoose /><Installation /><ProductGallery /><About /><FAQ /><FinalCTA /><ContactSection />
      </main>
      {isRestrictedArea && (
        <>
          <div className="login-restriction-backdrop" aria-hidden="true" />
          <aside className="login-restriction-popup" aria-label="Login required">
            <img src="/login-overlay.png" alt="Log in to explore more about Scarface EV" />
            <a className="login-restriction-login" href="./login.html" aria-label="Login" />
          </aside>
        </>
      )}
    </>
  );
}
