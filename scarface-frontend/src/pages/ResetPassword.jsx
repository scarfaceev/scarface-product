import { useState } from "react";
import logo from "../assets/logo/logo-removebg-preview.png";
import { authApiUrl } from "../utils/auth-api.js";
import "../styles/account-access.css";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,128}$/;

export default function ResetPassword() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    if (token && !passwordPattern.test(password)) {
      setIsError(true);
      setMessage("Use 8-128 characters with uppercase, lowercase, and a number.");
      return;
    }
    if (token && password !== confirmation) {
      setIsError(true);
      setMessage("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(authApiUrl(token ? "password/reset" : "password/forgot"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(token ? { token, password } : { email: email.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setIsError(true);
        setMessage(payload?.error?.message || "The request could not be completed.");
        return;
      }
      if (token) {
        setCompleted(true);
        setMessage("Your password has been reset. You can now sign in.");
      } else {
        setMessage("If an account exists for that address, a password reset link will be sent.");
      }
    } catch {
      setIsError(true);
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="sev-account-page">
      <section className="sev-account-card sev-reset-card" aria-labelledby="sev-reset-heading">
        <a className="sev-account-logo-link" href="./index.html" aria-label="Scarface EV home">
          <img className="sev-account-logo" src={logo} alt="Scarface EV Solutions" />
        </a>
        <h1 className="sev-account-heading" id="sev-reset-heading">
          {token ? "Reset password" : "Forgot password"}
        </h1>
        <p className="sev-account-subtitle">
          {token ? "Choose a new password for your account." : "Enter your email and we'll send a reset link if an account exists."}
        </p>

        {!completed && (
          <form className="sev-account-form" onSubmit={submit}>
            {!token ? (
              <div className="sev-account-field">
                <label htmlFor="sev-reset-email">Email address</label>
                <input
                  className="sev-account-input"
                  id="sev-reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            ) : (
              <>
                <div className="sev-account-field">
                  <label htmlFor="sev-reset-password">New password</label>
                  <input
                    className="sev-account-input"
                    id="sev-reset-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="sev-account-field">
                  <label htmlFor="sev-reset-confirmation">Confirm new password</label>
                  <input
                    className="sev-account-input"
                    id="sev-reset-confirmation"
                    type="password"
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    required
                  />
                </div>
              </>
            )}
            <button className="sev-account-submit" type="submit" disabled={submitting}>
              {submitting ? "Please wait..." : token ? "Reset password" : "Send reset link"}
            </button>
            {message && <p className={isError ? "sev-account-error" : "sev-account-success"} role={isError ? "alert" : "status"}>{message}</p>}
          </form>
        )}
        {completed && <p className="sev-account-success" role="status">{message}</p>}
        <p className="sev-account-switch">
          <a className="sev-account-link" href="./login.html">Return to login</a>
        </p>
        <a className="sev-account-home" href="./index.html">Return to homepage</a>
      </section>
    </main>
  );
}
