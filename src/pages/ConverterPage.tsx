import { useState, useEffect, useMemo } from 'react';
import LinedTextArea from '../components/LinedTextArea';
import SEO from '../components/SEO';
import { parseInput, type ImportFormat } from '../utils/importers';
import {
    toJsonString,
    toCsvString,
    toSqlInsert,
    toXmlString,
    toYamlString,
    toGraphQL,
    toTypeScript,
    downloadJson,
    downloadCsv,
    downloadSql,
    downloadXml,
    downloadYaml,
    downloadGraphQL,
    downloadTypeScript
} from '../utils/exporters';
import { translations } from '../i18n';
import type { Language } from '../types';

type OutputFormat = 'json' | 'csv' | 'sql' | 'xml' | 'yaml' | 'graphql' | 'typescript';

const inputFormats: ImportFormat[] = ['json', 'csv', 'xml', 'yaml'];
const outputFormats: OutputFormat[] = ['json', 'csv', 'sql', 'xml', 'yaml', 'graphql', 'typescript'];

export default function ConverterPage() {
    const [input, setInput] = useState('');
    const [inputFormat, setInputFormat] = useState<ImportFormat>('json');
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('json');
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [output, setOutput] = useState('');

    // Use existing language state from localStorage or default
    const [language] = useState<Language>(() => {
        if (typeof window === 'undefined') return 'en';
        const stored = window.localStorage.getItem('mdg.language');
        return stored === 'tr' ? 'tr' : 'en';
    });

    const t = translations[language];

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

    const handleDownload = () => {
        if (!parsedData.length) return;
        switch (outputFormat) {
            case 'json': downloadJson(parsedData, 'converted.json'); break;
            case 'csv': downloadCsv(parsedData, 'converted.csv'); break;
            case 'sql': downloadSql(parsedData, 'converted_data', 'converted.sql'); break;
            case 'xml': downloadXml(parsedData, 'converted.xml'); break;
            case 'yaml': downloadYaml(parsedData, 'converted.yaml'); break;
            case 'graphql': downloadGraphQL(parsedData, 'ConvertedData', 'converted.graphql'); break;
            case 'typescript': downloadTypeScript(parsedData, 'ConvertedData', 'converted.ts'); break;
        }
    };

    return (
        <div className="app">
            <SEO
                title="Universal Data Converter"
                description="Convert data between JSON, CSV, XML, YAML, SQL, and more instantly in your browser."
            />

            <header className="hero hero--sm">
                <div className="hero__content">
                    <h1>Universal Data Converter</h1>
                    <p>Transform your data instantly between formats. Client-side & secure.</p>
                </div>
            </header>

            <div className="generator-layout">
                <div className="generator-workspace">
                    {/* INPUT PANEL */}
                    <div className="workspace-panel input-panel">
                        <div className="panel-header">
                            <h3>Input</h3>
                            <select
                                value={inputFormat}
                                onChange={(e) => setInputFormat(e.target.value as ImportFormat)}
                                className="format-select"
                            >
                                {inputFormats.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <LinedTextArea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={`Paste your ${inputFormat.toUpperCase()} here...`}
                        />
                        {error && (
                            <div className="error-box">
                                <h4>Parse Error</h4>
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    {/* OUTPUT PANEL */}
                    <div className="workspace-panel output-panel">
                        <div className="panel-header">
                            <h3>Output</h3>
                            <div className="output-controls">
                                <select
                                    value={outputFormat}
                                    onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                                    className="format-select"
                                >
                                    {outputFormats.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                                </select>
                                <button className="generate-btn sm" onClick={handleDownload} disabled={!output}>
                                    Download
                                </button>
                            </div>
                        </div>
                        <pre className="preview-code">{output || 'Result will appear here...'}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
