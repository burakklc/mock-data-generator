import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, GripVertical, Settings2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import type { ManualField } from '../types';

interface SidebarProps {
    fields: ManualField[];
    onChange: (fields: ManualField[]) => void;
}

function generateId() {
    return Math.random().toString(36).slice(2);
}

function FieldNode({ 
    field, 
    onUpdate, 
    onRemove, 
    depth = 0 
}: { 
    field: ManualField; 
    onUpdate: (f: ManualField) => void; 
    onRemove: () => void;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    const isContainer = field.type === 'object' || (field.type === 'array' && field.arrayItemType === 'object');

    const handleAddChild = () => {
        const newChild: ManualField = { id: generateId(), name: 'newField', type: 'string', required: true };
        onUpdate({ ...field, children: [...(field.children || []), newChild] });
        setExpanded(true);
    };

    const handleUpdateChild = (childId: string, updatedChild: ManualField) => {
        const newChildren = (field.children || []).map(c => c.id === childId ? updatedChild : c);
        onUpdate({ ...field, children: newChildren });
    };

    const handleRemoveChild = (childId: string) => {
        const newChildren = (field.children || []).filter(c => c.id !== childId);
        onUpdate({ ...field, children: newChildren });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border border-gray-700/50 rounded-md bg-gray-800/40 mt-2`}
            style={{ marginLeft: depth > 0 ? '1rem' : '0' }}
        >
            <div className={`p-2 flex items-center gap-2 group hover:bg-gray-700/30 transition-colors ${showSettings ? 'border-b border-gray-700/50' : ''}`}>
                <GripVertical className="w-4 h-4 text-gray-600 cursor-grab flex-shrink-0" />
                
                {isContainer ? (
                    <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-white">
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                ) : <div className="w-4 h-4" />}

                <input
                    value={field.name}
                    onChange={(e) => onUpdate({ ...field, name: e.target.value })}
                    className="bg-transparent border border-transparent hover:border-gray-600 focus:border-primary focus:bg-gray-900 rounded text-sm text-gray-200 focus:outline-none focus:ring-0 w-24 flex-1 px-1 py-0.5"
                    placeholder="Field Name"
                />

                <select
                    value={field.type}
                    onChange={(e) => onUpdate({ ...field, type: e.target.value as any })}
                    className="bg-transparent border-none text-xs text-purple-300 outline-none w-24 cursor-pointer"
                >
                    <optgroup label="Primitives">
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="integer">Integer</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="uuid">UUID</option>
                    </optgroup>
                    <optgroup label="Complex">
                        <option value="object">Object</option>
                        <option value="array">Array</option>
                        <option value="enum">Enum</option>
                        <option value="formula">Formula</option>
                    </optgroup>
                    <optgroup label="Fintech">
                        <option value="iban">IBAN</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="cvv">CVV</option>
                        <option value="wallet_address">Crypto Wallet</option>
                        <option value="currency_code">Currency Code</option>
                    </optgroup>
                </select>

                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-1 rounded transition-colors ${showSettings ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'}`}
                >
                    <Settings2 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={onRemove}
                    className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Advanced Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-gray-900/50"
                    >
                        <div className="p-3 text-xs space-y-3 border-b border-gray-700/50">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={field.required} 
                                        onChange={e => onUpdate({ ...field, required: e.target.checked })}
                                        className="rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary focus:ring-1 focus:ring-offset-0"
                                    />
                                    <span className="text-gray-300">Required</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={field.unique || false} 
                                        onChange={e => onUpdate({ ...field, unique: e.target.checked })}
                                        className="rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary focus:ring-1 focus:ring-offset-0"
                                    />
                                    <span className="text-gray-300">Unique</span>
                                </label>
                            </div>

                            {field.type === 'array' && (
                                <div className="space-y-1">
                                    <label className="text-gray-400">Array Item Type</label>
                                    <select
                                        value={field.arrayItemType || 'string'}
                                        onChange={(e) => onUpdate({ ...field, arrayItemType: e.target.value as any })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 px-2 py-1.5 focus:border-primary focus:outline-none"
                                    >
                                        <option value="string">String</option>
                                        <option value="number">Number</option>
                                        <option value="integer">Integer</option>
                                        <option value="boolean">Boolean</option>
                                        <option value="date">Date</option>
                                        <option value="object">Object</option>
                                    </select>
                                </div>
                            )}

                            {field.type === 'string' && (
                                <>
                                    <div className="flex gap-2">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-gray-400">Min Length</label>
                                            <input type="number" value={field.minLength ?? ''} onChange={e => onUpdate({ ...field, minLength: e.target.value ? Number(e.target.value) : undefined })} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:border-primary focus:outline-none" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-gray-400">Max Length</label>
                                            <input type="number" value={field.maxLength ?? ''} onChange={e => onUpdate({ ...field, maxLength: e.target.value ? Number(e.target.value) : undefined })} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:border-primary focus:outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-gray-400">Regex Pattern</label>
                                        <input type="text" value={field.pattern ?? ''} onChange={e => onUpdate({ ...field, pattern: e.target.value || undefined })} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:border-primary focus:outline-none font-mono" placeholder="^A-Z+$" />
                                    </div>
                                </>
                            )}

                            {(field.type === 'string' || field.type === 'enum') && (
                                <div className="space-y-1">
                                    <label className="text-gray-400">Enum Values (comma separated)</label>
                                    <input type="text" value={field.enumValues ?? ''} onChange={e => onUpdate({ ...field, enumValues: e.target.value || undefined })} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:border-primary focus:outline-none" placeholder="red, green, blue" />
                                </div>
                            )}

                            {(field.type === 'number' || field.type === 'integer') && (
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-gray-400">Minimum</label>
                                        <input type="number" value={field.minimum ?? ''} onChange={e => onUpdate({ ...field, minimum: e.target.value ? Number(e.target.value) : undefined })} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:border-primary focus:outline-none" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-gray-400">Maximum</label>
                                        <input type="number" value={field.maximum ?? ''} onChange={e => onUpdate({ ...field, maximum: e.target.value ? Number(e.target.value) : undefined })} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:border-primary focus:outline-none" />
                                    </div>
                                </div>
                            )}

                            {field.type === 'formula' && (
                                <div className="space-y-1">
                                    <label className="text-gray-400">Formula Expression</label>
                                    <input type="text" value={field.formula ?? ''} onChange={e => onUpdate({ ...field, formula: e.target.value || undefined })} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:border-primary focus:outline-none font-mono" placeholder="row.firstName + ' ' + row.lastName" />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Children container */}
            {isContainer && expanded && (
                <div className="p-2 pt-0">
                    {field.children?.map(child => (
                        <FieldNode 
                            key={child.id} 
                            field={child} 
                            onUpdate={(u) => handleUpdateChild(child.id, u)} 
                            onRemove={() => handleRemoveChild(child.id)} 
                            depth={depth + 1} 
                        />
                    ))}
                    <button
                        onClick={handleAddChild}
                        className="mt-2 text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors px-1"
                    >
                        <Plus className="w-3 h-3" /> Add child property
                    </button>
                </div>
            )}
        </motion.div>
    );
}

export function Sidebar({ fields, onChange }: SidebarProps) {
    const handleAddField = () => {
        onChange([...fields, { id: generateId(), name: 'newField', type: 'string', required: true }]);
    };

    const handleUpdateField = (id: string, updatedField: ManualField) => {
        onChange(fields.map(f => f.id === id ? updatedField : f));
    };

    const handleRemoveField = (id: string) => {
        onChange(fields.filter(f => f.id !== id));
    };

    return (
        <div className="w-[380px] border-r border-gray-800 bg-gray-900/30 flex flex-col h-full bg-dark">
            <div className="h-14 border-b border-gray-800 flex items-center px-4 font-semibold text-sm text-gray-200 bg-[#0d1117]">
                Schema Builder
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                {fields.map((field) => (
                    <FieldNode 
                        key={field.id}
                        field={field}
                        onUpdate={(u) => handleUpdateField(field.id, u)}
                        onRemove={() => handleRemoveField(field.id)}
                    />
                ))}

                <div className="pt-4 pb-2">
                    <Button
                        variant="outline"
                        className="w-full border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800/50"
                        onClick={handleAddField}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                    </Button>
                </div>
            </div>
        </div>
    );
}
