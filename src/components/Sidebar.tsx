import { motion } from 'framer-motion';
import { Plus, Search, GripVertical } from 'lucide-react';
import { Button } from './ui/Button';

export interface FieldType {
    id: string;
    name: string;
    type: string;
}

interface SidebarProps {
    fields: FieldType[];
    onAddField: () => void;
    onRemoveField: (id: string) => void;
    onUpdateField: (id: string, updates: Partial<FieldType>) => void;
}

export function Sidebar({ fields, onAddField, onRemoveField, onUpdateField }: SidebarProps) {
    return (
        <div className="w-80 border-r border-gray-800 bg-gray-900/30 flex flex-col h-full bg-dark">
            <div className="h-12 border-b border-gray-800 flex items-center px-4 font-medium text-sm text-gray-300">
                Configuration
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {/* Fields List */}
                <div className="space-y-2">
                    {fields.map((field) => (
                        <motion.div
                            key={field.id}
                            layout
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800 border border-gray-700 rounded-md p-3 group hover:border-gray-600 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <GripVertical className="w-4 h-4 text-gray-600 cursor-grab" />
                                <input
                                    value={field.name}
                                    onChange={(e) => onUpdateField(field.id, { name: e.target.value })}
                                    className="bg-transparent border-none text-sm text-gray-200 focus:outline-none focus:ring-0 w-full placeholder:text-gray-600"
                                    placeholder="Field Name"
                                />
                                <button
                                    onClick={() => onRemoveField(field.id)}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="pl-7">
                                <select
                                    value={field.type}
                                    onChange={(e) => onUpdateField(field.id, { type: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded text-xs text-gray-400 px-2 py-1.5 focus:border-primary focus:outline-none"
                                >
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="date">Date</option>
                                    <option value="uuid">UUID</option>
                                    <option value="email">Email</option>
                                    <option value="fullName">Full Name</option>
                                </select>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <Button
                    variant="outline"
                    className="w-full border-dashed border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500 hover:bg-gray-800/50"
                    onClick={onAddField}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                </Button>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-800">
                {/* Placeholder for future presets or settings */}
                <div className="text-xs text-gray-600 text-center">
                    Drag to reorder fields
                </div>
            </div>
        </div>
    );
}
