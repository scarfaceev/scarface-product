import { useState } from "react";
import logo from "../assets/logo/logo-removebg-preview.png";
import Overlays from "../components/Overlays";
import googleIcon from "../assets/auth-providers/google.png";
import microsoftIcon from "../assets/auth-providers/microsoft.png";
import appleIcon from "../assets/auth-providers/apple.png";
import githubIcon from "../assets/auth-providers/github.png";
import "../styles/account-access.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register({
  loginHref = "./login.html",
  homeHref = "./index.html",
}) {
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, type, value, checked } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => current[name] ? { ...current, [name]: "" } : current);
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.fullName.trim()) nextErrors.fullName = "Enter your full name.";
    if (!values.email.trim()) nextErrors.email = "Enter your email address.";
    else if (!emailPattern.test(values.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!values.password) nextErrors.password = "Enter a password.";
    if (!values.confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
    else if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = "The passwords do not match.";
    }
    if (!values.termsAccepted) nextErrors.termsAccepted = "Accept the Terms and Privacy Policy to continue.";
    return nextErrors;
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      event.currentTarget.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setSubmitting(true);
    setServerError("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || undefined,
          password: values.password,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setServerError(payload?.error?.message || "Registration could not be completed.");
        return;
      }
      window.location.href = homeHref;
    } catch {
      setServerError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openPolicy = (event, policy) => {
    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent("scarface:open-policy", { detail: policy }));
  };

  return (
    <main className="sev-account-page">
      <section className="sev-account-card sev-register-card" aria-labelledby="sev-register-heading">
        <a className="sev-account-logo-link" href={homeHref} aria-label="Scarface EV home">
          <img className="sev-account-logo" src={logo} alt="Scarface EV Solutions" />
        </a>
        <h1 className="sev-account-heading" id="sev-register-heading">Create Account</h1>
        <p className="sev-account-subtitle">Join the Scarface EV community.</p>

        <form className="sev-account-form" onSubmit={submit} noValidate>
          <div className="sev-account-field">
            <label htmlFor="sev-register-name">Full name</label>
            <input
              className="sev-account-input"
              id="sev-register-name"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              value={values.fullName}
              onChange={updateField}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "sev-register-name-error" : undefined}
              required
            />
            {errors.fullName && <span className="sev-account-error" id="sev-register-name-error" role="alert">{errors.fullName}</span>}
          </div>

          <div className="sev-account-field">
            <label htmlFor="sev-register-email">Email address</label>
            <input
              className="sev-account-input"
              id="sev-register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="mail@website.com"
              value={values.email}
              onChange={updateField}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "sev-register-email-error" : undefined}
              required
            />
            {errors.email && <span className="sev-account-error" id="sev-register-email-error" role="alert">{errors.email}</span>}
          </div>

          <div className="sev-account-field">
            <label htmlFor="sev-register-phone">Phone number <span className="sev-optional">(optional)</span></label>
            <input
              className="sev-account-input"
              id="sev-register-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Phone number"
              value={values.phone}
              onChange={updateField}
            />
          </div>

          <div className="sev-account-field">
            <label htmlFor="sev-register-password">Password</label>
            <div className="sev-password-wrap">
              <input
                className="sev-account-input"
                id="sev-register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 character"
                value={values.password}
                onChange={updateField}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "sev-register-password-error" : undefined}
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
            {errors.password && <span className="sev-account-error" id="sev-register-password-error" role="alert">{errors.password}</span>}
          </div>

          <div className="sev-account-field">
            <label htmlFor="sev-register-confirm-password">Confirm password</label>
            <div className="sev-password-wrap">
              <input
                className="sev-account-input"
                id="sev-register-confirm-password"
                name="confirmPassword"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={values.confirmPassword}
                onChange={updateField}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "sev-register-confirm-error" : undefined}
                required
              />
              <button
                className="sev-password-toggle"
                type="button"
                aria-label={showConfirmation ? "Hide password confirmation" : "Show password confirmation"}
                aria-pressed={showConfirmation}
                onClick={() => setShowConfirmation((value) => !value)}
              >
                {showConfirmation ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && <span className="sev-account-error" id="sev-register-confirm-error" role="alert">{errors.confirmPassword}</span>}
          </div>

          <div className="sev-account-field">
            <label className="sev-check-label sev-terms-label" htmlFor="sev-register-terms">
              <input
                id="sev-register-terms"
                name="termsAccepted"
                type="checkbox"
                checked={values.termsAccepted}
                onChange={updateField}
                aria-invalid={Boolean(errors.termsAccepted)}
                aria-describedby={errors.termsAccepted ? "sev-register-terms-error" : undefined}
                required
              />
              <span>
                I have read and agree to the{" "}
                <a className="sev-account-link" href="#terms" onClick={(event) => openPolicy(event, "terms")}>
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a className="sev-account-link" href="#privacy" onClick={(event) => openPolicy(event, "privacy")}>
                  Privacy Policy
                </a>.
              </span>
            </label>
            {errors.termsAccepted && <span className="sev-account-error" id="sev-register-terms-error" role="alert">{errors.termsAccepted}</span>}
          </div>

          <button className="sev-account-submit" type="submit" disabled={submitting}>{submitting ? "Creating account..." : "Create Account"}</button>
          {serverError && <p className="sev-account-error" role="alert">{serverError}</p>}
        </form>

        <div className="sev-social-section" aria-label="Social registration options">
          <div className="sev-social-divider"><span>Or continue with</span></div>
          <div className="sev-social-buttons">
            <button type="button" disabled title="Google login is not configured"><img className="sev-social-icon" src={googleIcon} alt="" /><span className="sev-social-label">Google</span></button>
            <button type="button" disabled title="Microsoft login is not configured"><img className="sev-social-icon" src={microsoftIcon} alt="" /><span className="sev-social-label">Microsoft</span></button>
            <button type="button" disabled title="Apple login is not configured"><img className="sev-social-icon" src={appleIcon} alt="" /><span className="sev-social-label">Apple</span></button>
            <button type="button" disabled title="GitHub login is not configured"><img className="sev-social-icon" src={githubIcon} alt="" /><span className="sev-social-label">GitHub</span></button>
          </div>
        </div>

        <p className="sev-account-switch">
          Already have an account? <a className="sev-account-link" href={loginHref}>Login</a>
        </p>
        <a className="sev-account-home" href={homeHref}>Return to homepage</a>
      </section>
      <Overlays policyOnly />
    </main>
  );
}
