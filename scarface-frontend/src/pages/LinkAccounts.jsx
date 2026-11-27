import { useEffect, useState } from "react";
import logo from "../assets/logo/logo-removebg-preview.png";
import SocialAuthButtons from "../components/SocialAuthButtons.jsx";
import { authApiUrl } from "../utils/auth-api.js";
import { oauthErrorMessage } from "../utils/oauth-errors.js";
import "../styles/account-access.css";

const providers = {
  google: { name: "Google", exclude: ["apple", "microsoft", "github"] },
  apple: { name: "Apple", exclude: ["google", "microsoft", "github"] },
};

export default function LinkAccounts() {
  const providerId = new URLSearchParams(window.location.search).get("provider");
  const provider = providers[providerId];
  const [ready, setReady] = useState(false);
  const [serverError, setServerError] = useState(() => oauthErrorMessage(window.location.search));

  useEffect(() => {
    let active = true;
    if (!provider) {
      setServerError("Choose a supported provider to link.");
      return () => { active = false; };
    }

    fetch(authApiUrl("me"), { credentials: "include" })
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          window.location.replace(`./login.html?linkProvider=${providerId}`);
          return;
        }
        const payload = await response.json();
        if (!payload?.data?.phone) {
          window.location.replace("./complete-profile.html");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (active) setServerError("Unable to verify your sign-in. Please try again.");
      });

    return () => { active = false; };
  }, [provider, providerId]);

  return (
    <main className="sev-account-page">
      <section className="sev-account-card sev-login-card" aria-labelledby="sev-link-heading">
        <a className="sev-account-logo-link" href="./index.html" aria-label="Scarface EV home">
          <img className="sev-account-logo" src={logo} alt="Scarface EV Solutions" />
        </a>
        <h1 className="sev-account-heading" id="sev-link-heading">Link your account</h1>
        <p className="sev-account-subtitle">
          {provider ? `Connect ${provider.name} to your signed-in Scarface EV account.` : "Choose a supported provider to continue."}
        </p>
        {serverError && <p className="sev-account-error" role="alert">{serverError}</p>}
        {ready && provider && (
          <SocialAuthButtons
            label="Link a social account"
            excludeProviders={provider.exclude}
            centered
            linking
          />
        )}
        <a className="sev-account-home" href="./index.html">Return to homepage</a>
      </section>
    </main>
  );
}
