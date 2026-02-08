import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileJson,
  Database,
  Table,
  Code2,
  Download,
  Copy,
  Check,
  Settings2,
  RefreshCw
} from 'lucide-react';

import { DashboardShell } from '../components/DashboardShell';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sidebar, type FieldType } from '../components/Sidebar';
import { CodePreview } from '../components/CodePreview';
import { generateRecords, type GenerationOutcome } from '../utils/generator';
import {
  toJsonString,
  toCsvString,
  toSqlInsert,
  downloadJson,
  downloadCsv,
  downloadSql
} from '../utils/exporters';
import { manualFieldsToSchema } from '../utils/manualSchema';
import { createManualField } from '../pages/HomePage'; // Importing helper from original file if possible, or redefine

// Re-defining helper since we are replacing the file content
function createNewField(): FieldType {
  return {
    id: Math.random().toString(36).slice(2),
    name: 'newField',
    type: 'string',
  };
}

const TOOLS = [
  {
    id: 'json',
    title: 'JSON Generator',
    description: 'Generate robust JSON datasets with schema validation.',
    icon: FileJson,
    color: 'text-yellow-400',
    preview: '{ "id": 1, "name": "..." }'
  },
  {
    id: 'csv',
    title: 'CSV / Excel',
    description: 'Create spreadsheet-ready data for analysis.',
    icon: Table,
    color: 'text-green-400',
    preview: 'id,name\n1,Alice'
  },
  {
    id: 'sql',
    title: 'SQL Insert',
    description: 'Generate INSERT statements for your database.',
    icon: Database,
    color: 'text-blue-400',
    preview: 'INSERT INTO users...'
  },
  {
    id: 'api',
    title: 'Custom API',
    description: 'Mock API endpoints with dynamic responses.',
    icon: Code2,
    color: 'text-purple-400',
    preview: 'GET /api/users'
  }
];

export default function HomePage() {
  const [view, setView] = useState<'hero' | 'workspace'>('hero');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldType[]>([
    { id: '1', name: 'id', type: 'integer' },
    { id: '2', name: 'firstName', type: 'string' },
    { id: '3', name: 'email', type: 'email' },
  ]);
  const [recordCount, setRecordCount] = useState(10);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initial generation on load or field change
  useMemo(() => {
    // Debounce generation in real app
    const generate = async () => {
      // Convert simplified fields to manual fields format expected by generator
      const manualFields = fields.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type as any, // casting for simplicity in this refactor
        required: true
      }));

      const result = manualFieldsToSchema(manualFields);
      if (!result.errors.length) {
        const outcome = await generateRecords(result.schema, recordCount, 0);
        setGeneratedData(outcome.records);
      }
    };
    generate();
  }, [fields, recordCount]);

  const previewCode = useMemo(() => {
    if (!generatedData.length) return '';
    if (activeTool === 'csv') return toCsvString(generatedData);
    if (activeTool === 'sql') return toSqlInsert(generatedData, 'mock_table');
    return toJsonString(generatedData);
  }, [generatedData, activeTool]);

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
    setView('workspace');
  };

  const handleAddField = () => {
    setFields([...fields, createNewField()]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleUpdateField = (id: string, updates: Partial<FieldType>) => {
    setFields(fields.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(previewCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (activeTool === 'csv') downloadCsv(generatedData);
    else if (activeTool === 'sql') downloadSql(generatedData, 'mock_table');
    else downloadJson(generatedData);
  };

  return (
    <DashboardShell activeView={view}>
      {/* HERO VIEW */}
      {view === 'hero' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16 z-10"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Generate test data in seconds.
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              Create realistic JSON, CSV, and SQL datasets without the friction.
              <br />
              Runs entirely in your browser.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl z-10">
            {TOOLS.map((tool) => (
              <Card
                key={tool.id}
                layoutId={`card-${tool.id}`}
                onClick={() => handleToolSelect(tool.id)}
                className="group hover:bg-gray-800/80"
              >
                <CardHeader className="flex items-start justify-between pb-2">
                  <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                    <tool.icon className={cn("w-6 h-6", tool.color)} />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-gray-500">
                    Click to open
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold text-gray-200 mb-2">{tool.title}</h3>
                  <p className="text-sm text-gray-500">{tool.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* WORKSPACE VIEW */}
      {view === 'workspace' && (
        <div className="flex flex-1 overflow-hidden">
          {/* SIDEBAR CONFIG */}
          <Sidebar
            fields={fields}
            onAddField={handleAddField}
            onRemoveField={handleRemoveField}
            onUpdateField={handleUpdateField}
          />

          {/* MAIN PREVIEW AREA */}
          <div className="flex-1 flex flex-col bg-[#0d1117]">
            {/* TOOLBAR */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0d1117]">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView('hero')}
                  className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-2"
                >
                  ← Back
                </button>
                <div className="h-4 w-[1px] bg-gray-700" />
                <span className="text-sm font-semibold text-gray-200">
                  {TOOLS.find(t => t.id === activeTool)?.title}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 mr-4">
                  <label className="text-xs text-gray-500 font-medium">Rows:</label>
                  <input
                    type="number"
                    value={recordCount}
                    onChange={(e) => setRecordCount(Number(e.target.value))}
                    className="w-16 bg-gray-800 border-none rounded text-xs text-center py-1.5 focus:ring-1 focus:ring-primary text-gray-300"
                  />
                </div>

                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span className="ml-2">{copied ? 'Copied' : 'Copy'}</span>
                </Button>

                <Button size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* CODE PREVIEW */}
            <CodePreview code={previewCode} />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

// Helper utility for classnames
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
