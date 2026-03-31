import { useState, useEffect } from 'react';
import { Copy, Download, Check, ArrowRightLeft, Settings2 } from 'lucide-react';
import LinedTextArea from '../components/LinedTextArea';
import { CodePreview } from '../components/CodePreview';
import SEO from '../components/SEO';
import { Button } from '../components/ui/Button';
import { parseInput, type ImportFormat } from '../utils/importers';
import {
    toJsonString,
    toCsvString,
    toSqlInsert,
    toXmlString,
    toYamlString,
    toGraphQL,
    toTypeScript,
} from '../utils/exporters';

type OutputFormat = 'json' | 'csv' | 'sql' | 'xml' | 'yaml' | 'graphql' | 'typescript';

const inputFormats: ImportFormat[] = ['json', 'csv', 'xml', 'yaml'];
const outputFormats: OutputFormat[] = ['json', 'csv', 'sql', 'xml', 'yaml', 'graphql', 'typescript'];

export default function ConverterPage() {
    const [input, setInput] = useState('');
    const [inputFormat, setInputFormat] = useState<ImportFormat>('json');
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('yaml');
    
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [output, setOutput] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const result = parseInput(input, inputFormat);
        if (result.error) {
            setError(result.error);
            setParsedData([]);
        } else {
            setError(null);
            setParsedData(result.data);
        }
    }, [input, inputFormat]);

    useEffect(() => {
        if (parsedData.length === 0) {
            setOutput('');
            return;
        }

        try {
            let result = '';
            switch (outputFormat) {
                case 'json': result = toJsonString(parsedData); break;
                case 'csv': result = toCsvString(parsedData); break;
                case 'sql': result = toSqlInsert(parsedData, 'converted_data'); break;
                case 'xml': result = toXmlString(parsedData); break;
                case 'yaml': result = toYamlString(parsedData); break;
                case 'graphql': result = toGraphQL(parsedData, 'ConvertedData'); break;
                case 'typescript': result = toTypeScript(parsedData, 'ConvertedData'); break;
            }
            setOutput(result);
        } catch (e) {
            setOutput(`Error converting to ${outputFormat}: ${(e as Error).message}`);
        }
    }, [parsedData, outputFormat]);

    const handleCopy = async () => {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const exts: Record<string, string> = { json: 'json', csv: 'csv', sql: 'sql', xml: 'xml', yaml: 'yaml', graphql: 'graphql', typescript: 'ts' };
        a.download = `converted.${exts[outputFormat] || 'txt'}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col flex-1 bg-[#0d1117] h-[calc(100vh-64px)] overflow-hidden">
            <SEO
                title="Universal Data Converter | Free JSON to SQL, CSV, XML"
                description="Instantly transform mock data between JSON, CSV, XML, YAML, SQL, GraphQL, and TypeScript entirely in your browser without backend processing."
            />

            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 flex-shrink-0 z-20">
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="w-5 h-5 text-purple-400" />
                <h1 className="text-sm font-semibold text-gray-200">
                  Universal Format Converter
                </h1>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden font-mono text-sm">
                {/* LEFT PANEL: INPUT */}
                <div className="flex flex-col w-[450px] border-r border-gray-800 bg-gray-900/30">
                    <div className="h-12 flex items-center bg-[#0d1117] border-b border-gray-800 px-4 justify-between">
                        <span className="text-gray-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                           <Settings2 className="w-3.5 h-3.5" /> Source Data
                        </span>
                        <select
                            value={inputFormat}
                            onChange={(e) => setInputFormat(e.target.value as ImportFormat)}
                            className="bg-gray-800 border border-gray-700 text-xs rounded py-1 px-2 text-white focus:ring-1 focus:ring-purple-500 outline-none"
                        >
                            {inputFormats.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden relative">
                        <div className="flex-1 rounded border border-gray-700/50 overflow-hidden bg-[#0d1117]/80">
                            <LinedTextArea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Paste your raw ${inputFormat.toUpperCase()} here...`}
                            />
                        </div>
                        {error && (
                            <div className="absolute bottom-6 left-6 right-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded break-all shadow-lg backdrop-blur-md">
                                <strong className="block mb-1">Parsing Error:</strong>
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: OUTPUT */}
                <div className="flex-1 flex flex-col bg-[#0d1117]">
                    {/* TOOLBAR */}
                    <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4 gap-2 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Target Format</span>
                            <select
                                value={outputFormat}
                                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                                className="bg-gray-800 border border-gray-700 text-xs rounded py-1 px-2 text-purple-300 font-semibold focus:ring-1 focus:ring-purple-500 outline-none"
                            >
                                {outputFormats.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!output}>
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400 group-hover:text-white" />}
                                <span className={`ml-2 hidden xl:inline ${copied ? 'text-green-400' : 'text-gray-400'}`}>{copied ? 'Copied' : 'Copy Code'}</span>
                            </Button>
                            <Button size="sm" onClick={handleDownload} disabled={!output}>
                                <Download className="w-4 h-4 mr-2" />
                                Download File
                            </Button>
                        </div>
                    </div>

                    {/* CODE PREVIEW */}
                    <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
                        <div className="min-h-[400px]">
                            {output ? (
                                <CodePreview code={output} language={
                                    outputFormat === 'json' ? 'json' :
                                    outputFormat === 'sql' ? 'sql' :
                                    outputFormat === 'graphql' ? 'graphql' :
                                    outputFormat === 'typescript' ? 'typescript' :
                                    outputFormat === 'xml' ? 'xml' :
                                    outputFormat === 'yaml' ? 'yaml' : 'csv'
                                } />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-600 italic">
                                    Awaiting valid {inputFormat.toUpperCase()} input...
                                </div>
                            )}
                        </div>

                        {/* SEO ARTICLE FOOTER */}
                        <div className="p-8 mt-auto border-t border-gray-800/50 text-gray-400 text-sm bg-[#0d1117]">
                            <article className="max-w-4xl mx-auto">
                                <h2 className="text-xl font-bold text-gray-200 mb-3">Free Universal Data Converter (JSON to SQL, CSV, GraphQL)</h2>
                                <p className="mb-2 leading-relaxed">Modern web applications deal with data in multiple structures. Whether you are migrating NoSQL JSON documents into legacy Relational Databases (SQL), or building strictly typed `GraphQL` schema definitions, our universal converting tool handles the transformation instantly within your browser.</p>
                                <h3 className="text-lg font-semibold text-gray-300 mt-4 mb-2">Zero-Server Security Guarantee</h3>
                                <p className="leading-relaxed">Unlike traditional format converters, MockData.net does not send your raw payloads to a backend server for parsing. Utilizing Javascript bindings like `yaml` and recursive DOM tree walkers, your sensitive JSON records are converted to `CSV` or `TypeScript` locally. This guarantees absolute compliance with GDPR constraints when parsing proprietary company exports.</p>
                            </article>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
