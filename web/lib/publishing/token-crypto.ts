import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** Cifra los tokens de las redes con AES-256-GCM. La clave vive en el servidor, en base64 de 32 bytes. */
function readKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) throw new Error("La clave de tokens debe medir 32 bytes en base64.");
  return key;
}

export function encryptToken(token: string, base64Key: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", readKey(base64Key), iv);
  const data = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function decryptToken(sealed: string, base64Key: string): string {
  const [version, iv, tag, data] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Token cifrado con un formato desconocido.");
  const decipher = createDecipheriv("aes-256-gcm", readKey(base64Key), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
