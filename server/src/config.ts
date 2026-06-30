/**
 * Centralized, validated runtime configuration.
 *
 * The JWT secret is the key that signs every session token. A hardcoded
 * fallback (as previously existed) means anyone with the source code can forge
 * tokens for any role — so we refuse to start in production without a strong
 * secret, and only fall back to a clearly-insecure value in development.
 */

export const IS_PROD = process.env.NODE_ENV === "production";

const MIN_SECRET_LENGTH = 32;

function loadJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= MIN_SECRET_LENGTH) return secret;

  if (IS_PROD) {
    throw new Error(
      `JWT_SECRET must be set to a strong random value (>= ${MIN_SECRET_LENGTH} chars) in production. ` +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
  }

  console.warn(
    `⚠️  JWT_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} chars — using an insecure ` +
      "development-only secret. Set a strong JWT_SECRET before deploying."
  );
  return secret || "dev-only-insecure-secret-do-not-use-in-production";
}

export const JWT_SECRET = loadJwtSecret();
