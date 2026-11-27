import { useState } from "react";
import logo from "../assets/logo/logo-removebg-preview.png";
import SocialAuthButtons from "../components/SocialAuthButtons.jsx";
import { authApiUrl } from "../utils/auth-api.js";
import "../styles/account-access.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login({
  registerHref = "./register.html",
  homeHref = "./index.html",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(() => {
    const oauthError = new URLSearchParams(window.location.search).get("oauthError");
    if (oauthError === "not_configured") return "This sign-in provider is not configured yet.";
    if (oauthError === "expired") return "Your sign-in attempt expired. Please try again.";
    if (oauthError) return "Sign-in could not be completed. Please try again.";
    return "";
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setServerError("");
    const nextErrors = {};
    const normalizedEmail = email.trim();
    if (!normalizedEmail) nextErrors.email = "Enter your email address.";
    else if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!password) nextErrors.password = "Enter your password.";
    else if (password.length > 128) nextErrors.password = "Password must be 128 characters or fewer.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    try {
      const response = await fetch(authApiUrl("login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const fieldErrors = {};
        if (Array.isArray(payload?.error?.fields)) {
          for (const issue of payload.error.fields) {
            if (["email", "password"].includes(issue.path) && !fieldErrors[issue.path] && typeof issue.message === "string") {
              fieldErrors[issue.path] = issue.message;
            }
          }
        }
        setErrors((current) => ({ ...current, ...fieldErrors }));
        setServerError(Object.keys(fieldErrors).length > 0
          ? ""
          : payload?.error?.message || "Login could not be completed.");
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

        <form className="sev-account-form" onSubmit={submit} noValidate>
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
              onChange={(event) => {
                setEmail(event.target.value);
                setServerError("");
                setErrors((current) => {
                  const next = { ...current };
                  delete next.email;
                  return next;
                });
              }}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "sev-login-email-error" : undefined}
              required
            />
            {errors.email && <span className="sev-account-error" id="sev-login-email-error" role="alert">{errors.email}</span>}
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
                onChange={(event) => {
                  setPassword(event.target.value);
                  setServerError("");
                  setErrors((current) => {
                    const next = { ...current };
                    delete next.password;
                    return next;
                  });
                }}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "sev-login-password-error" : undefined}
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
            {errors.password && <span className="sev-account-error" id="sev-login-password-error" role="alert">{errors.password}</span>}
          </div>

          <div className="sev-account-options">
            <label className="sev-check-label" htmlFor="sev-remember-me">
              <input id="sev-remember-me" name="rememberMe" type="checkbox" />
              <span>Remember me</span>
            </label>
            <a className="sev-account-link" href="./reset-password.html">
              Forgot password?
            </a>
          </div>

          <button className="sev-account-submit" type="submit" disabled={submitting}>{submitting ? "Logging in..." : "Login"}</button>
          {serverError && <p className="sev-account-error" role="alert">{serverError}</p>}
        </form>

        <SocialAuthButtons label="Social login options" />

        <p className="sev-account-switch">
          Not registered yet? <a className="sev-account-link" href={registerHref}>Create an Account</a>
        </p>
        <a className="sev-account-home" href={homeHref}>Return to homepage</a>
      </section>
    </main>
  );
}
