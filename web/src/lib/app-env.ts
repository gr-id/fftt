export function getAppEnv() {
  return process.env.APP_ENV === "stage" ? "stage" : "production";
}

export function isStageEnvironment() {
  return getAppEnv() === "stage";
}

export function isGoogleSsoEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_GOOGLE_SSO === "true";
}
