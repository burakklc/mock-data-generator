import React, { useState, useEffect, useMemo } from 'react';
import RandExp from 'randexp';
import { Copy, Download, Check, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import LinedTextArea from './LinedTextArea';
import { CodePreview } from './CodePreview';

export default function RegexWorkspace() {
  const [pattern, setPattern] = useState('^[A-Z]{3}-\\d{4}$'); // e.g. ABC-1234
  const [recordCount, setRecordCount] = useState(10);
  const [generatedData, setGeneratedData] = useState<string[]>([]);
  const [error, setError] = useState('');
  
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generate();
  }, [pattern, recordCount]);

  const generate = () => {
    try {
      if (!pattern.trim()) {
        setGeneratedData([]);
        setError('');
        return;
      }
      
      const randexp = new RandExp(new RegExp(pattern));
      // Cap the length to prevent extreme freezes
      randexp.max = 100;
      
      const results: string[] = [];
      for (let i = 0; i < recordCount; i++) {
        results.push(randexp.gen());
      }
      
      setGeneratedData(results);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid Regular Expression');
    }
  };

  const outputString = useMemo(() => {
    return generatedData.join('\n');
  }, [generatedData]);

  const handleCopy = async () => {
    if (!outputString) return;
    await navigator.clipboard.writeText(outputString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputString) return;
    const blob = new Blob([outputString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'regex-data.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-[#0d1117] text-gray-300 font-mono text-sm">
      {/* LEFT PANEL: Inputs */}
      <div className="flex flex-col w-[380px] border-r border-gray-800 bg-gray-900/30">
        <div className="h-12 flex items-center bg-[#0d1117] border-b border-gray-800 px-4">
          <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Pattern Definition</span>
        </div>
        
        <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-semibold text-blue-400">Regular Expression</label>
            <p className="text-xs text-gray-500 mb-2">Enter a standard Regex pattern. The engine will randomly generate strings that satisfy it.</p>
            <div className="flex-1 min-h-[150px] max-h-[300px] border border-gray-700/50 rounded overflow-hidden">
              <LinedTextArea 
                value={pattern} 
                onChange={e => setPattern(e.target.value)} 
                placeholder="^[a-f0-9]{32}$"
              />
            </div>
            {error && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded break-all">
                {error}
              </div>
            )}
          </div>
          
          <div className="border border-gray-700/50 rounded p-4 bg-gray-900/50 flex flex-col gap-3">
             <div className="flex items-center justify-between">
               <label className="text-xs font-medium text-gray-400">Rows to Generate</label>
               <input
                 type="number"
                 className="w-20 bg-gray-800 border border-gray-700 text-center rounded py-1 px-2 focus:ring-1 focus:ring-blue-500 outline-none"
                 value={recordCount}
                 onChange={(e) => setRecordCount(Number(e.target.value))}
                 min={1}
                 max={100000}
               />
             </div>
             
             <Button onClick={generate} className="w-full flex justify-center items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Regenerate Data
             </Button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Output */}
      <div className="flex-1 flex flex-col bg-[#0d1117]">
        {/* TOOLBAR */}
        <div className="h-14 border-b border-gray-800 flex items-center justify-end px-4 gap-2 shrink-0">
           <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span className="ml-2 hidden xl:inline">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download .TXT
            </Button>
        </div>

        {/* CODE PREVIEW */}
        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
          <CodePreview code={outputString} />
          
          <div className="p-8 border-t border-gray-800/50 text-gray-400 text-sm">
            <article className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-gray-200 mb-3">Free Bulk Regex Data Generator</h2>
              <p className="mb-2 leading-relaxed">Enter any valid Regular Expression and our engine will reverse-engineer it to generate thousands of matching strings instantly.</p>
              <h3 className="text-lg font-semibold text-gray-300 mt-4 mb-2">Why Generate Data via Regex?</h3>
              <p className="leading-relaxed">When testing custom internal ID structures, regional license plates, or highly specific cryptographic formats, standard faker libraries often fall short. By defining a regex pattern <code>(e.g., ^[A-Z]{'{3}'}-\d{'{4}'}$)</code>, you guarantee that every single mocked record adheres perfectly to your application's rigid validation constraints.</p>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
