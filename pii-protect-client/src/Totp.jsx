// src/Totp.jsx
import React, { useEffect, useState } from 'react';

export default function Totp() {
  const [code, setCode] = useState('------');
  const [timeLeft, setTimeLeft] = useState(30);

  // This should match backend's secret.
  // IMPORTANT: Secret may only be HARDCODED for Proof of Concept
  // Otherwise, this MUST be fetched securely from the backend via API and NEVER exposed in client-side code
  const SECRET = 'AAIC24SAJANPCQP3AI6AXG26KY2WMG6J';

  const generateTOTP = async () => {
    const base32ToUint8Array = (b32) => {
      const digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const bytes = [];
      let buffer = 0;
      let bits = 0;
      for (const c of b32.toUpperCase()) {
        if (c === '=') break;
        const val = digits.indexOf(c);
        if (val === -1) throw new Error('Invalid base32');
        buffer = (buffer << 5) | val;
        bits += 5;
        if (bits >= 8) {
          bytes.push((buffer >>> (bits - 8)) & 255);
          bits -= 8;
        }
      }
      return new Uint8Array(bytes);
    };

    try {
      const key = base32ToUint8Array(SECRET);
      const counter = Math.floor(Date.now() / 1000 / 30);

      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setUint32(4, counter, false); // Big-endian

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
      const hash = new Uint8Array(signature);
      const offset = hash[hash.length - 1] & 0xf;

      const binary =
        ((hash[offset]     & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) <<  8) |
         (hash[offset + 3] & 0xff);

      const otp = (binary % 1000000).toString().padStart(6, '0');
      setCode(otp);
    } catch (err) {
      console.error('TOTP failed:', err);
      setCode('ERROR');
    }
  };

  useEffect(() => {
    generateTOTP(); // Initial code

    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const secondsIntoPeriod = now % 30;
      const secondsRemaining = 30 - secondsIntoPeriod;

      setTimeLeft(secondsRemaining);

      // Regenerate exactly when a new 30-second period starts
      if (secondsIntoPeriod === 0) {
        generateTOTP();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-10">
          One-Time Security Code
        </h2>

        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl py-10 px-8 mb-8">
          <div className="text-6xl font-mono font-black text-white tracking-widest select-all">
            {code}
          </div>
        </div>

        <p className="text-2xl text-gray-700 mb-2">
          Expires in <span className="text-5xl font-bold text-red-600"> {timeLeft} </span> s
        </p>

        <p className="mt-8 text-gray-500 text-xs font-medium tracking-tight">
          Please read this 6-digit code aloud to your service provider<br />
        </p>
      </div>
    </div>
  );
}