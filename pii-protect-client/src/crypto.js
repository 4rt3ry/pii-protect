

const encoder = new TextEncoder();

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}



function arrayBufferToPem(spkiBuffer) {
  // Format DER -> base64 -> PEM wrapper for SubjectPublicKeyInfo
  const b64 = arrayBufferToBase64(spkiBuffer);
  const chunkSize = 64;
  const chunks = [];
  for (let i = 0; i < b64.length; i += chunkSize) {
    chunks.push(b64.slice(i, i + chunkSize));
  }
  return `-----BEGIN PUBLIC KEY-----\n${chunks.join('\n')}\n-----END PUBLIC KEY-----\n`;
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '');
  return base64ToArrayBuffer(b64);
}


export async function generateEcdhKeyPair() {
  return await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-384' }, // matches SECP384R1
    true,
    ['deriveKey', 'deriveBits']
  );
}

export async function exportPublicKeyToPem(publicKey) {
  const spki = await window.crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToPem(spki);
}

export async function importPublicKeyFromPem(pem) {
  const raw = pemToArrayBuffer(pem);
  return await window.crypto.subtle.importKey(
    'spki',
    raw,
    { name: 'ECDH', namedCurve: 'P-384' },
    true,
    []
  );
}

export async function deriveSymKey(clientPrivateKey, serverPublicKey) {
  // derive raw shared secret bits (P-384 => 384 bits)
  const sharedBits = await window.crypto.subtle.deriveBits(
    { name: 'ECDH', public: serverPublicKey },
    clientPrivateKey,
    384
    
    
  ); // 384 bits

  // import as raw key for HKDF
  const hkdfKey = await window.crypto.subtle.importKey(
    'raw',
    sharedBits,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM 256 via HKDF-SHA512
  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-512',
      salt: new Uint8Array([]), // you can use null/empty salt; server used same HKDF parameters
      info: encoder.encode('handshake data'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return aesKey;
}

export async function aesEncrypt(aesKey, plainObj) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recommended
  const plainText = encoder.encode(JSON.stringify(plainObj));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    plainText
  );
  return {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertext)
  };
}