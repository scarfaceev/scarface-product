import { useEffect, useState } from "react";
import logo from "../assets/logo/logo-removebg-preview.png";
import { authApiUrl } from "../utils/auth-api.js";
import "../styles/account-access.css";

const phonePattern = /^\+?[0-9][0-9\s().-]*$/;

export default function CompleteProfile() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(authApiUrl("me"), { credentials: "include" })
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          window.location.replace("./login.html");
          return;
        }
        const payload = await response.json();
        if (payload?.data?.phone) {
          window.location.replace("./index.html");
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => {
        if (active) {
          setServerError("Unable to verify your sign-in. Please try again.");
          setCheckingSession(false);
        }
      });

    return () => { active = false; };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const normalizedPhone = phone.trim();
    if (normalizedPhone.length < 7 || normalizedPhone.length > 32 || !phonePattern.test(normalizedPhone)) {
      setError("Enter a valid phone number.");
      return;
    }

    setError("");
    setServerError("");
    setSubmitting(true);
    try {
      const response = await fetch(authApiUrl("profile/complete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const phoneError = Array.isArray(payload?.error?.fields)
          ? payload.error.fields.find((field) => field.path === "phone")?.message
          : "";
        setError(phoneError || "");
        setServerError(phoneError ? "" : payload?.error?.message || "Profile could not be completed.");
        return;
      }
      window.location.replace("./index.html");
    } catch {
      setServerError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="sev-account-page">
      <section className="sev-account-card sev-login-card" aria-labelledby="sev-profile-heading">
        <a className="sev-account-logo-link" href="./index.html" aria-label="Scarface EV home">
          <img className="sev-account-logo" src={logo} alt="Scarface EV Solutions" />
        </a>
        <h1 className="sev-account-heading" id="sev-profile-heading">Complete your profile</h1>
        <p className="sev-account-subtitle">Add your phone number to continue.</p>
        {!checkingSession && (
          <form className="sev-account-form" onSubmit={submit} noValidate>
            <div className="sev-account-field">
              <label htmlFor="sev-profile-phone">Phone number</label>
              <input
                className="sev-account-input"
                id="sev-profile-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setError("");
                  setServerError("");
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "sev-profile-phone-error" : undefined}
                required
              />
              {error && <span className="sev-account-error" id="sev-profile-phone-error" role="alert">{error}</span>}
            </div>
            <button className="sev-account-submit" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Continue"}
            </button>
            {serverError && <p className="sev-account-error" role="alert">{serverError}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
