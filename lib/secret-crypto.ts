import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function encryptionKey(): Buffer {
  const value = process.env.EVENTHUB_SETTINGS_ENCRYPTION_KEY?.trim();

  if (!value) {
    throw new Error(
      "EVENTHUB_SETTINGS_ENCRYPTION_KEY não configurada. Use uma chave aleatória de pelo menos 32 caracteres."
    );
  }

  return crypto.createHash("sha256").update(value).digest();
}

export function encryptSecret(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(normalized, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const normalized = payload.trim();
  if (!normalized) return "";

  const [version, ivPart, tagPart, encryptedPart] = normalized.split(".");

  if (version !== "v1" || !ivPart || !tagPart || !encryptedPart) {
    throw new Error("Credencial SMTP criptografada em formato inválido.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    encryptionKey(),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
