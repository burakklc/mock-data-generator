import React, { useState, useEffect } from 'react';
import { SignJWT, decodeJwt, decodeProtectedHeader } from 'jose';
import LinedTextArea from './LinedTextArea';

export default function JwtWorkspace() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  
  // Encode Mode State
  const [headerJson, setHeaderJson] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payloadJson, setPayloadJson] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [encodedToken, setEncodedToken] = useState('');
  const [encodeError, setEncodeError] = useState('');

  // Decode Mode State
  const [tokenInput, setTokenInput] = useState('');
  const [decodedHeader, setDecodedHeader] = useState('');
  const [decodedPayload, setDecodedPayload] = useState('');
  const [decodeError, setDecodeError] = useState('');

  // Live Encode Effect
  useEffect(() => {
    if (mode !== 'encode') return;
    const generateToken = async () => {
      try {
        setEncodeError('');
        const header = JSON.parse(headerJson);
        const payload = JSON.parse(payloadJson);
        
        if (!header.alg) throw new Error("Header must contain 'alg'");
        
        const secretKey = new TextEncoder().encode(secret || 'secret');
        
        const jwt = await new SignJWT(payload)
          .setProtectedHeader(header)
          .sign(secretKey);
          
        setEncodedToken(jwt);
      } catch (err: any) {
        setEncodeError(err.message || 'Invalid JSON format');
      }
    };
    generateToken();
  }, [headerJson, payloadJson, secret, mode]);

  // Live Decode Effect
  useEffect(() => {
    if (mode !== 'decode') return;
    if (!tokenInput.trim()) {
      setDecodedHeader('');
      setDecodedPayload('');
      setDecodeError('');
      return;
    }
    try {
      setDecodeError('');
      const header = decodeProtectedHeader(tokenInput);
      const payload = decodeJwt(tokenInput);
      setDecodedHeader(JSON.stringify(header, null, 2));
      setDecodedPayload(JSON.stringify(payload, null, 2));
    } catch (err: any) {
      setDecodeError(err.message || 'Invalid JWT Token format');
    }
  }, [tokenInput, mode]);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-[#0d1117] text-gray-300 font-mono text-sm">
      {/* LEFT PANEL */}
      <div className="flex flex-col w-1/2 border-r border-gray-800">
        <div className="h-12 border-b border-gray-800 flex items-center px-4 bg-gray-900/50 gap-4">
          <button 
            onClick={() => setMode('encode')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${mode === 'encode' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            ENCODE
          </button>
          <button 
            onClick={() => setMode('decode')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${mode === 'decode' ? 'bg-purple-600/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            DECODE
          </button>
        </div>

        {mode === 'encode' ? (
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto scrollbar-hide">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-red-400">HEADER: ALGORITHM & TOKEN TYPE</label>
              <div className="h-32 rounded border border-gray-700/50 overflow-hidden">
                <LinedTextArea value={headerJson} onChange={e => setHeaderJson(e.target.value)} />
              </div>
            </div>
            
            <div className="flex flex-col gap-1 flex-1 min-h-[200px]">
              <label className="text-xs font-bold text-purple-400">PAYLOAD: DATA</label>
              <div className="flex-1 rounded border border-gray-700/50 overflow-hidden">
                <LinedTextArea value={payloadJson} onChange={e => setPayloadJson(e.target.value)} />
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-blue-400">VERIFY SIGNATURE</label>
              <div className="p-3 bg-gray-800/50 rounded border border-gray-700/50">
                <div className="text-gray-500 font-mono text-xs mb-2">
                  HMACSHA256( base64UrlEncode(header) + "." + base64UrlEncode(payload),
                </div>
                <input 
                  type="text" 
                  value={secret} 
                  onChange={e => setSecret(e.target.value)}
                  placeholder="your-256-bit-secret"
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-blue-300 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <div className="text-gray-500 font-mono text-xs mt-2">)</div>
              </div>
            </div>
            {encodeError && <div className="text-red-400 text-xs mt-2 bg-red-400/10 p-2 rounded">{encodeError}</div>}
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-4 gap-2">
            <label className="text-xs font-bold text-gray-400">ENCODED TOKEN</label>
            <textarea 
              className="flex-1 bg-gray-900/50 border border-gray-800 rounded p-4 text-gray-300 break-all resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Paste a JWT (eyJ...)"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col w-1/2 bg-[#0d1117] p-4">
        {mode === 'encode' ? (
          <div className="flex-1 flex flex-col gap-2">
             <label className="text-xs font-bold text-gray-400">ENCODED OUPUT</label>
             <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded p-6 break-all overflow-y-auto">
               {encodedToken ? (
                 <div className="leading-relaxed">
                   <span className="text-red-400">{encodedToken.split('.')[0]}</span>
                   <span className="text-gray-500">.</span>
                   <span className="text-purple-400">{encodedToken.split('.')[1]}</span>
                   <span className="text-gray-500">.</span>
                   <span className="text-blue-400">{encodedToken.split('.')[2]}</span>
                 </div>
               ) : (
                 <span className="text-gray-600 italic">Computing...</span>
               )}
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-hide">
             <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-red-400">HEADER</label>
              <div className="h-32 rounded border border-gray-700/50 overflow-hidden bg-gray-900/50 p-3 overflow-y-auto">
                <pre className="text-red-300">{decodedHeader}</pre>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-bold text-purple-400">PAYLOAD</label>
              <div className="flex-1 rounded border border-gray-700/50 overflow-hidden bg-gray-900/50 p-3 overflow-y-auto">
                <pre className="text-purple-300">{decodedPayload}</pre>
              </div>
            </div>
            {decodeError && <div className="text-red-400 text-xs mt-2 bg-red-400/10 p-2 rounded">{decodeError}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
