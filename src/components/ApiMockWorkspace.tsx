import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Play, Lock, Clock, Settings2, Globe, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Sidebar } from './Sidebar';
import { CodePreview } from './CodePreview';
import type { ApiEndpoint, ManualField } from '../types';
import { manualFieldsToSchema } from '../utils/manualSchema';
import { generateRecords } from '../utils/generator';

const DEFAULT_FIELDS: ManualField[] = [
  { id: '1', name: 'id', type: 'integer', required: true },
  { id: '2', name: 'name', type: 'string', required: true }
];

export function ApiMockWorkspace() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([
    {
      id: 'default-1',
      method: 'GET',
      path: '/api/v1/users',
      responseType: 'array',
      recordCount: 5,
      status: 200,
      latency: 500,
      requiresAuth: false,
      fields: DEFAULT_FIELDS
    }
  ]);
  const [activeId, setActiveId] = useState<string>('default-1');
  const [isSimulating, setIsSimulating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const activeEndpoint = endpoints.find(e => e.id === activeId) || endpoints[0];

  const updateEndpoint = (id: string, updates: Partial<ApiEndpoint>) => {
    setEndpoints(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
    // Reset preview when schema changes
    if (Object.keys(updates).includes('fields') || Object.keys(updates).includes('responseType')) {
      setPreviewData(null);
    }
  };

  const handleCreate = () => {
    const newEp: ApiEndpoint = {
      id: Math.random().toString(36).slice(2),
      method: 'GET',
      path: '/api/v1/new-endpoint',
      responseType: 'object',
      recordCount: 1,
      status: 200,
      latency: 0,
      requiresAuth: false,
      fields: [{ id: Math.random().toString(36).slice(2), name: 'message', type: 'string', required: true }]
    };
    setEndpoints([...endpoints, newEp]);
    setActiveId(newEp.id);
    setPreviewData(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (endpoints.length === 1) return;
    const newEndpoints = endpoints.filter(ep => ep.id !== id);
    setEndpoints(newEndpoints);
    if (activeId === id) setActiveId(newEndpoints[0].id);
  };

  const handleTest = async () => {
    setIsSimulating(true);
    setPreviewData(null);

    // Simulate Network Latency
    await new Promise(resolve => setTimeout(resolve, activeEndpoint.latency));

    // Simulate Auth
    if (activeEndpoint.requiresAuth) {
      // For this mock environment, we just simulate what it would return if unauthenticated
      setPreviewData({
        error: "Unauthorized",
        message: "Missing or invalid Bearer token."
      });
      setIsSimulating(false);
      return;
    }

    // Generate Payload
    try {
      const result = manualFieldsToSchema(activeEndpoint.fields);
      // Wait, we need to handle responseType array vs object
      // If array, we use global generateRecords with count
      // If object, we generate 1 record and return that object directly
      const countToGen = activeEndpoint.responseType === 'array' ? activeEndpoint.recordCount : 1;

      const outcome = await generateRecords(result.schema, { count: countToGen }, 0);
      
      const responsePayload = activeEndpoint.responseType === 'array' ? outcome.records : outcome.records[0];
      setPreviewData(responsePayload);
    } catch (err) {
      setPreviewData({ error: 'Generation failed', details: String(err) });
    } finally {
      setIsSimulating(false);
    }
  };

  const statusColors: Record<number, string> = {
    200: 'text-green-400',
    201: 'text-green-400',
    400: 'text-yellow-400',
    401: 'text-red-400',
    403: 'text-red-400',
    404: 'text-yellow-400',
    500: 'text-red-500'
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0d1117] relative z-10">
      
      {/* LEFT PANEL: Endpoints List */}
      <div className="w-64 border-r border-gray-800 bg-[#0d1117]/80 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" /> Endpoints
          </h2>
          <Button variant="ghost" size="sm" onClick={handleCreate} className="h-7 w-7 p-0 rounded-full">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
          {endpoints.map(ep => (
            <button
              key={ep.id}
              onClick={() => setActiveId(ep.id)}
              className={`w-full text-left px-3 py-2 flex items-center justify-between rounded-md group transition-colors ${
                activeId === ep.id ? 'bg-purple-500/10 border border-purple-500/30' : 'hover:bg-gray-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 border rounded leading-none ${
                    ep.method === 'GET' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10' :
                    ep.method === 'POST' ? 'text-green-400 border-green-400/30 bg-green-400/10' :
                    ep.method === 'PUT' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
                    ep.method === 'PATCH' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
                    'text-red-400 border-red-400/30 bg-red-400/10'
                }`}>
                  {ep.method}
                </span>
                <span className="text-xs text-gray-300 truncate" title={ep.path}>{ep.path}</span>
              </div>
              {endpoints.length > 1 && (
                <Trash2 
                  className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all flex-shrink-0" 
                  onClick={(e) => handleDelete(ep.id, e)}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN PANEL: Endpoint Editor & Simulator */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Endpoint Config Header */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/40 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px] space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Route Definition</label>
            <div className="flex rounded-md overflow-hidden border border-gray-700 focus-within:ring-1 focus-within:ring-purple-500">
              <select
                value={activeEndpoint.method}
                onChange={(e) => updateEndpoint(activeEndpoint.id, { method: e.target.value as any })}
                className="bg-gray-800 text-xs font-bold px-3 py-2 border-r border-gray-700 outline-none text-gray-200"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                value={activeEndpoint.path}
                onChange={(e) => updateEndpoint(activeEndpoint.id, { path: e.target.value })}
                className="bg-[#0d1117] px-3 py-2 text-sm text-gray-200 w-full outline-none"
                placeholder="/api/resource"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> Latency (ms)</label>
              <input
                type="number"
                value={activeEndpoint.latency}
                onChange={(e) => updateEndpoint(activeEndpoint.id, { latency: Number(e.target.value) })}
                className="w-24 bg-gray-800 border border-gray-700 rounded-md text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500 text-gray-200"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1"><Settings2 className="w-3 h-3"/> Status Code</label>
              <select
                value={activeEndpoint.status}
                onChange={(e) => updateEndpoint(activeEndpoint.id, { status: Number(e.target.value) })}
                className={`w-24 bg-gray-800 border border-gray-700 rounded-md text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500 font-bold ${statusColors[activeEndpoint.status] || 'text-gray-200'}`}
              >
                <option value={200}>200 OK</option>
                <option value={201}>201 Created</option>
                <option value={400}>400 Bad Request</option>
                <option value={401}>401 Unauthorized</option>
                <option value={403}>403 Forbidden</option>
                <option value={404}>404 Not Found</option>
                <option value={500}>500 Server Error</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 ml-auto">
            <Button onClick={handleTest} disabled={isSimulating} className="bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] border-0">
              {isSimulating ? (
                <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"/> Simulating...</span>
              ) : (
                <span className="flex items-center gap-2"><Play className="w-4 h-4 fill-current"/> Test Endpoint</span>
              )}
            </Button>
          </div>
        </div>

        {/* Workspace Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Response Schema Builder */}
          <div className="w-1/2 border-r border-gray-800 flex flex-col bg-[#0d1117] overflow-hidden">
            <div className="p-3 border-b border-gray-800 bg-gray-900/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Response Schema</span>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded border border-gray-700">
                  <span className="text-[10px] text-gray-400 font-medium uppercase">Format</span>
                  <select 
                    value={activeEndpoint.responseType}
                    onChange={(e) => updateEndpoint(activeEndpoint.id, { responseType: e.target.value as any })}
                    className="bg-transparent text-xs text-purple-300 outline-none font-medium cursor-pointer"
                  >
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                  </select>
                </div>

                {activeEndpoint.responseType === 'array' && (
                  <div className="flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded border border-gray-700">
                     <span className="text-[10px] text-gray-400 font-medium uppercase">Count</span>
                     <input
                        type="number"
                        value={activeEndpoint.recordCount}
                        onChange={(e) => updateEndpoint(activeEndpoint.id, { recordCount: Number(e.target.value) })}
                        className="w-12 bg-transparent text-xs text-purple-300 outline-none text-center font-medium"
                     />
                  </div>
                )}
                
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${activeEndpoint.requiresAuth ? 'bg-purple-500 border-purple-500' : 'border-gray-600 group-hover:border-gray-500'}`}>
                    {activeEndpoint.requiresAuth && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={activeEndpoint.requiresAuth}
                    onChange={(e) => updateEndpoint(activeEndpoint.id, { requiresAuth: e.target.checked })}
                  />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Auth
                  </span>
                </label>
              </div>

            </div>
            <div className="flex-1 overflow-y-auto w-full relative">
              <div className="absolute inset-0">
                <Sidebar 
                  fields={activeEndpoint.fields} 
                  onChange={(fields) => updateEndpoint(activeEndpoint.id, { fields })} 
                />
              </div>
            </div>
          </div>

          {/* Simulator Output View */}
          <div className="w-1/2 flex flex-col bg-black/40">
            <div className="p-3 border-b border-gray-800 bg-gray-900/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Simulator Output</span>
              {previewData && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${statusColors[activeEndpoint.status] || 'text-gray-300'} border ${statusColors[activeEndpoint.status]?.replace('text-', 'border-') || 'border-gray-600'} bg-black/20`}>
                  HTTP {activeEndpoint.status}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-hidden relative">
              {isSimulating ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 transition-opacity">
                    <div className="w-8 h-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin mb-4" />
                    <p className="text-purple-400 text-sm font-medium animate-pulse">Waiting for latency ({activeEndpoint.latency}ms)...</p>
                 </div>
              ) : previewData ? (
                 <CodePreview code={JSON.stringify(previewData, null, 2)} language="json" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                  <Play className="w-8 h-8 opacity-20" />
                  <p className="text-sm">Click "Test Endpoint" to simulate a request</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
