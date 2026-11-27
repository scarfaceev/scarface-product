const providerNames = {
  google: "Google",
  apple: "Apple",
};

export function oauthErrorMessage(search) {
  const parameters = new URLSearchParams(search);
  const providerName = providerNames[parameters.get("provider") ?? parameters.get("linkProvider")] ?? "This provider";
  switch (parameters.get("oauthError")) {
    case "not_configured":
      return "This sign-in provider is not configured yet.";
    case "expired":
      return "Your sign-in attempt expired. Please try again.";
    case "account_link_required":
      return `An account already uses this email. Sign in with that account first, then link ${providerName}.`;
    case "link_session_expired":
      return "Your account session expired. Sign in again before linking this provider.";
    case "identity_already_linked":
      return "This provider account is already linked to another user.";
    case "failed":
    case null:
      return parameters.has("oauthError") ? "Sign-in could not be completed. Please try again." : "";
    default:
      return "Sign-in could not be completed. Please try again.";
  }
}

export function requestedLinkProvider(search) {
  const provider = new URLSearchParams(search).get("linkProvider");
  return provider === "google" || provider === "apple" ? provider : "";
}
