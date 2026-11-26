import { useState } from "react";
import logo from "../assets/logo/logo-removebg-preview.png";
import googleIcon from "../assets/auth-providers/google.png";
import microsoftIcon from "../assets/auth-providers/microsoft.png";
import appleIcon from "../assets/auth-providers/apple.png";
import githubIcon from "../assets/auth-providers/github.png";
import "../styles/account-access.css";

export default function Login({
  registerHref = "./register.html",
  homeHref = "./index.html",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setServerError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setServerError(payload?.error?.message || "Login could not be completed.");
        return;
      }
      window.location.href = homeHref;
    } catch {
      setServerError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="sev-account-page">
      <section className="sev-account-card sev-login-card" aria-labelledby="sev-login-heading">
        <a className="sev-account-logo-link" href={homeHref} aria-label="Scarface EV home">
          <img className="sev-account-logo" src={logo} alt="Scarface EV Solutions" />
        </a>
        <h1 className="sev-account-heading" id="sev-login-heading">Login</h1>
        <p className="sev-account-subtitle">Continue to Scarface EV.</p>

        <form className="sev-account-form" onSubmit={submit}>
          <div className="sev-account-field">
            <label htmlFor="sev-login-email">Email address</label>
            <input
              className="sev-account-input"
              id="sev-login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="mail@website.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="sev-account-field">
            <label htmlFor="sev-login-password">Password</label>
            <div className="sev-password-wrap">
              <input
                className="sev-account-input"
                id="sev-login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Min. 8 character"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="sev-password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="sev-account-options">
            <label className="sev-check-label" htmlFor="sev-remember-me">
              <input id="sev-remember-me" name="rememberMe" type="checkbox" />
              <span>Remember me</span>
            </label>
            <a className="sev-account-link" href="#forgot-password">
              Forgot password?
            </a>
          </div>

          <button className="sev-account-submit" type="submit" disabled={submitting}>{submitting ? "Logging in..." : "Login"}</button>
          {serverError && <p className="sev-account-error" role="alert">{serverError}</p>}
        </form>

        <div className="sev-social-section" aria-label="Social login options">
          <div className="sev-social-divider"><span>Or continue with</span></div>
          <div className="sev-social-buttons">
            <button type="button" disabled title="Google login is not configured"><img className="sev-social-icon" src={googleIcon} alt="" /><span className="sev-social-label">Google</span></button>
            <button type="button" disabled title="Microsoft login is not configured"><img className="sev-social-icon" src={microsoftIcon} alt="" /><span className="sev-social-label">Microsoft</span></button>
            <button type="button" disabled title="Apple login is not configured"><img className="sev-social-icon" src={appleIcon} alt="" /><span className="sev-social-label">Apple</span></button>
            <button type="button" disabled title="GitHub login is not configured"><img className="sev-social-icon" src={githubIcon} alt="" /><span className="sev-social-label">GitHub</span></button>
          </div>
        </div>

        <p className="sev-account-switch">
          Not registered yet? <a className="sev-account-link" href={registerHref}>Create an Account</a>
        </p>
        <a className="sev-account-home" href={homeHref}>Return to homepage</a>
      </section>
    </main>
  );
}
