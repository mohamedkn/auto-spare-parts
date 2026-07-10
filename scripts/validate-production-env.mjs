import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const fileName of [".env.local", ".env"]) {
  const envPath = resolve(process.cwd(), fileName);
  if (!existsSync(envPath)) continue;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

const required = [
  "DATABASE_URL",
  "DIRECT_DATABASE_URL",
  "JWT_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "PAYMOB_API_KEY",
  "PAYMOB_HMAC_SECRET",
  "PAYMOB_IFRAME_ID",
  "GEMINI_API_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
];

const oneOf = [
  ["PAYMOB_INTEGRATION_ID", "PAYMOB_INTEGRATION_ID_CARD"],
];

const placeholderPatterns = [
  /^$/,
  /change-me/i,
  /example\.com/i,
  /localhost/i,
  /dummy/i,
  /your[-_]/i,
  /user:password/i,
];

const errors = [];

for (const key of required) {
  const value = process.env[key]?.trim() ?? "";
  if (!value) {
    errors.push(`${key} is required`);
    continue;
  }
  if (placeholderPatterns.some((pattern) => pattern.test(value))) {
    errors.push(`${key} still looks like a development or placeholder value`);
  }
}

for (const group of oneOf) {
  const values = group.map((key) => [key, process.env[key]?.trim() ?? ""]);
  if (!values.some(([, value]) => value)) {
    errors.push(`One of ${group.join(", ")} is required`);
  }
  for (const [key, value] of values) {
    if (value && placeholderPatterns.some((pattern) => pattern.test(value))) {
      errors.push(`${key} still looks like a development or placeholder value`);
    }
  }
}

const jwtSecret = process.env.JWT_SECRET?.trim() ?? "";
if (jwtSecret && jwtSecret.length < 32) {
  errors.push("JWT_SECRET must be at least 32 characters");
}

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
if (databaseUrl && !databaseUrl.includes("-pooler")) {
  errors.push("DATABASE_URL should use the pooled production database endpoint");
}

if (errors.length > 0) {
  console.error("Production launch environment is not ready:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Production launch environment looks ready.");
