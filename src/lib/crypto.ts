/**
 * Utilitário de criptografia para tokens OAuth do Google.
 * Usa AES-256-CBC para criptografar tokens antes de salvar no banco.
 *
 * @example
 *   const encrypted = encrypt(token);
 *   const original = decrypt(encrypted);
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Obtém a chave de criptografia do ambiente.
 * Garante exatamente 32 bytes para AES-256.
 */
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY não definida no .env.local. Gere uma com: openssl rand -hex 16"
    );
  }
  // Pad ou trunca para exatamente 32 bytes
  return Buffer.from(raw.padEnd(32, "0"), "utf-8").subarray(0, 32);
}

/**
 * Criptografa um texto usando AES-256-CBC.
 * Retorna no formato: iv_hex:encrypted_hex
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Descriptografa um texto criptografado com encrypt().
 */
export function decrypt(text: string): string {
  const key = getKey();
  const separatorIndex = text.indexOf(":");
  if (separatorIndex === -1) {
    throw new Error("Formato de texto criptografado inválido (falta separador ':').");
  }
  const ivHex = text.substring(0, separatorIndex);
  const encrypted = text.substring(separatorIndex + 1);
  const decipher = createDecipheriv(
    "aes-256-cbc",
    key,
    Buffer.from(ivHex, "hex")
  );
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
}
