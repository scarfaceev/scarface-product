import { useEffect, useRef } from "react";
import logo from "../assets/logo/logo-removebg-preview.png";
import "../styles/account-access.css";

export default function ExploreMoreModal({ open, loginHref = "./login.html" }) {
  const loginRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    loginRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;

  const keepFocusInDialog = (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    loginRef.current?.focus();
  };

  return (
    <div className="sev-explore-backdrop">
      <section
        className="sev-explore-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sev-explore-title"
        aria-describedby="sev-explore-message"
        onKeyDown={keepFocusInDialog}
      >
        <img className="sev-explore-logo" src={logo} alt="Scarface EV Solutions" />
        <p className="sev-explore-brand" id="sev-explore-title">SCARFACE EV</p>
        <p className="sev-explore-message" id="sev-explore-message">
          To explore more about Scarface EV
        </p>
        <p className="sev-explore-instruction">Click on Login</p>
        <a className="sev-explore-login" href={loginHref} ref={loginRef}>
          Login
        </a>
      </section>
    </div>
  );
}
