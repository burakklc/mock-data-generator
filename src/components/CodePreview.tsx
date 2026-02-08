interface CodePreviewProps {
    code: string;
    language?: string;
}

export function CodePreview({ code, language = 'json' }: CodePreviewProps) {
    // In a real implementation, we'd use Prism or a similar library for syntax highlighting
    // For now, we'll style a simple pre block using the requested JetBrains Mono font

    return (
        <div className="flex-1 bg-[#0d1117] overflow-hidden flex flex-col relative group">
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    className="bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded border border-gray-700 hover:bg-gray-700"
                    onClick={() => navigator.clipboard.writeText(code)}
                >
                    Copy
                </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
                <pre className="font-mono text-sm leading-relaxed text-gray-300">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
}
