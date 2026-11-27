import { useState } from "react";
import logo from "../assets/logo/logo-removebg-preview.png";
import SocialAuthButtons from "../components/SocialAuthButtons.jsx";
import { authApiUrl } from "../utils/auth-api.js";
import { oauthErrorMessage } from "../utils/oauth-errors.js";
import "../styles/account-access.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const gmailPattern = /^[^\s@]+@gmail\.com$/i;
const phonePattern = /^\+?[0-9][0-9\s().-]*$/;
const registrationFields = new Set(["fullName", "email", "phone", "password", "termsAccepted"]);

function getPasswordError(password) {
  if (!password) return "";
  if (password.length > 128) return "Password must be 128 characters or fewer.";
  const missing = [];
  const missingUppercase = !/[A-Z]/.test(password);
  const missingLowercase = !/[a-z]/.test(password);
  if (missingUppercase && missingLowercase) missing.push("upper and lower case letters");
  else if (missingUppercase) missing.push("an upper case letter");
  else if (missingLowercase) missing.push("a lower case letter");
  if (!/[0-9]/.test(password)) missing.push("numbers");
  if (!/[^A-Za-z0-9]/.test(password)) missing.push("a special character");
  if (missing.length === 0) {
    return password.length < 8 ? "Password must be at least 8 characters." : "";
  }
  const requirements = missing.length === 1
    ? missing[0]
    : `${missing.slice(0, -1).join(", ")}${missing.length > 2 ? "," : ""} and ${missing[missing.length - 1]}`;
  const lengthRequirement = password.length < 8 ? " and be at least 8 characters" : "";
  return `Password must include ${requirements}${lengthRequirement}.`;
}

function readFieldErrors(payload) {
  const fieldErrors = {};
  if (Array.isArray(payload?.error?.fields)) {
    for (const issue of payload.error.fields) {
      if (registrationFields.has(issue.path) && !fieldErrors[issue.path] && typeof issue.message === "string") {
        fieldErrors[issue.path] = issue.message;
      }
    }
  }
  return fieldErrors;
}

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
  const [serverError, setServerError] = useState(() => oauthErrorMessage(window.location.search));
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, type, value, checked } = event.target;
    setServerError("");
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      if (name === "password") {
        delete next.confirmPassword;
        const passwordError = getPasswordError(value);
        if (passwordError) next.password = passwordError;
      }
      if (name === "fullName" && value.trim() && !/^[A-Za-z ]+$/.test(value.trim())) {
        next.fullName = "Enter a valid name.";
      }
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};
    const fullName = values.fullName.trim();
    const email = values.email.trim();
    const phone = values.phone.trim();
    if (!fullName) nextErrors.fullName = "Enter your full name.";
    else if (!/^[A-Za-z ]+$/.test(fullName)) nextErrors.fullName = "Enter a valid name.";
    else if (fullName.length < 2) nextErrors.fullName = "Full name must be at least 2 characters.";
    else if (fullName.length > 120) nextErrors.fullName = "Full name must be 120 characters or fewer.";
    if (!email) nextErrors.email = "Enter your email address.";
    else if (email.length > 254 || !emailPattern.test(email) || !gmailPattern.test(email)) {
      nextErrors.email = "Enter a valid Gmail address";
    }
    if (!phone) nextErrors.phone = "Enter your phone number.";
    else if (phone.length < 7 || phone.length > 32 || !phonePattern.test(phone)) {
      nextErrors.phone = "Enter a valid phone number.";
    }
    if (!values.password) nextErrors.password = "Enter a password.";
    else {
      const passwordError = getPasswordError(values.password);
      if (passwordError) nextErrors.password = passwordError;
    }
    if (!values.confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
    else if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = "The passwords do not match.";
    }
    if (!values.termsAccepted) nextErrors.termsAccepted = "Accept the Terms and Conditions and Privacy Policy to continue.";
    return nextErrors;
  };

  const submit = async (event) => {
    event.preventDefault();
    setServerError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      event.currentTarget.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(authApiUrl("register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          password: values.password,
          termsAccepted: values.termsAccepted,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const fieldErrors = readFieldErrors(payload);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((current) => ({ ...current, ...fieldErrors }));
        }
        setServerError(Object.keys(fieldErrors).length > 0
          ? ""
          : payload?.error?.message || "Registration could not be completed.");
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
            <label htmlFor="sev-register-phone">Phone number</label>
            <input
              className="sev-account-input"
              id="sev-register-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Phone number"
              value={values.phone}
              onChange={updateField}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "sev-register-phone-error" : undefined}
              required
            />
            {errors.phone && <span className="sev-account-error" id="sev-register-phone-error" role="alert">{errors.phone}</span>}
          </div>

          <div className="sev-account-field">
            <label htmlFor="sev-register-email">Email address</label>
            <input
              className="sev-account-input"
              id="sev-register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="mail@gmail.com"
              value={values.email}
              onChange={updateField}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "sev-register-email-error" : undefined}
              required
            />
            {errors.email && <span className="sev-account-error" id="sev-register-email-error" role="alert">{errors.email}</span>}
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
              <span>I agree to the Terms and Conditions and Privacy Policy.</span>
            </label>
            {errors.termsAccepted && <span className="sev-account-error" id="sev-register-terms-error" role="alert">{errors.termsAccepted}</span>}
          </div>

          <button className="sev-account-submit" type="submit" disabled={submitting}>{submitting ? "Creating account..." : "Create Account"}</button>
          {serverError && <p className="sev-account-error" role="alert">{serverError}</p>}
        </form>

        <SocialAuthButtons
          label="Social registration options"
          excludeProviders={["microsoft", "github"]}
          centered
          authPage="register"
        />

        <p className="sev-account-switch">
          Already have an account? <a className="sev-account-link" href={loginHref}>Login</a>
        </p>
        <a className="sev-account-home" href={homeHref}>Return to homepage</a>
      </section>
    </main>
  );
}
