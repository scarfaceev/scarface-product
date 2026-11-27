import { useState } from "react";
import googleIcon from "../assets/auth-providers/google.png";
import microsoftIcon from "../assets/auth-providers/microsoft.png";
import appleIcon from "../assets/auth-providers/apple.png";
import githubIcon from "../assets/auth-providers/github.png";
import { authApiUrl } from "../utils/auth-api.js";

const providers = [
  { id: "google", name: "Google", icon: googleIcon },
  { id: "microsoft", name: "Microsoft", icon: microsoftIcon },
  { id: "apple", name: "Apple", icon: appleIcon },
  { id: "github", name: "GitHub", icon: githubIcon },
];

export default function SocialAuthButtons({
  label = "Social sign-in options",
  excludeProviders = [],
  centered = false,
  authPage = "login",
  linking = false,
}) {
  const [pendingProvider, setPendingProvider] = useState("");
  const visibleProviders = providers.filter((provider) => !excludeProviders.includes(provider.id));

  return (
    <div className="sev-social-section" aria-label={label}>
      <div className="sev-social-divider"><span>Or continue with</span></div>
      <div className={`sev-social-buttons${centered ? " sev-social-buttons-centered" : ""}`}>
        {visibleProviders.map((provider) => (
          <form
            key={provider.id}
            className="sev-social-form"
            action={authApiUrl(`oauth/${provider.id}${linking ? "/link" : ""}`)}
            method="post"
            onSubmit={() => setPendingProvider(provider.id)}
          >
            {!linking && <input type="hidden" name="authPage" value={authPage} />}
            <button
              className="sev-social-button"
              type="submit"
              disabled={Boolean(pendingProvider)}
              aria-busy={pendingProvider === provider.id}
              aria-label={`Continue with ${provider.name}`}
              title={`Continue with ${provider.name}`}
            >
              <img className="sev-social-icon" src={provider.icon} alt="" />
              <span className="sev-social-label">{provider.name}</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
