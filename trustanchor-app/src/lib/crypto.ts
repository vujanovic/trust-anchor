// src/lib/crypto.ts

/**
 * Generate RSA-OAEP key pair for encryption/decryption
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  )
}

/**
 * Export public key to SPKI format (base64)
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey)
  const exportedAsBase64 = btoa(
    String.fromCharCode(...new Uint8Array(exported))
  )
  return exportedAsBase64
}

/**
 * Export private key to PKCS8 format (base64) for local storage
 */
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey)
  const exportedAsBase64 = btoa(
    String.fromCharCode(...new Uint8Array(exported))
  )
  return exportedAsBase64
}

/**
 * Import private key from PKCS8 format (base64)
 */
export async function importPrivateKey(
  privateKeyBase64: string
): Promise<CryptoKey> {
  const binaryString = atob(privateKeyBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return await window.crypto.subtle.importKey(
    "pkcs8",
    bytes,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  )
}

/**
 * Decrypt base64 encoded encrypted message
 */
export async function decryptMessage(
  encryptedBase64: string,
  privateKey: CryptoKey
): Promise<string> {
  const binaryString = atob(encryptedBase64)
  const encryptedBytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    encryptedBytes[i] = binaryString.charCodeAt(i)
  }

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedBytes
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}

/**
 * Download private key as a file
 */
export function downloadPrivateKey(privateKeyBase64: string, email: string) {
  const pemKey = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)?.join("\n")}\n-----END PRIVATE KEY-----`
  const blob = new Blob([pemKey], { type: "application/x-pem-file" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${email.split("@")[0]}_private_key.pem`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
