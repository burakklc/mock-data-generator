import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutTemplate, ShoppingCart, Cpu, X, FileTerminal } from 'lucide-react';
import type { ManualField } from '../types';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (fields: ManualField[]) => void;
}

const TEMPLATES = [
  {
    id: 'e-commerce',
    title: 'E-Commerce Order',
    description: 'Generates users, shipping addresses, and arrays of ordered products.',
    icon: ShoppingCart,
    color: 'text-orange-400',
    fields: [
      { id: '1', name: 'orderId', type: 'string', required: true },
      { id: '2', name: 'customerName', type: 'string', required: true },
      { id: '3', name: 'amount', type: 'number', required: true },
      { id: '4', name: 'status', type: 'string', required: true, enumValues: 'PENDING, SHIPPED, DELIVERED' },
      { 
        id: '5', 
        name: 'shippingAddress', 
        type: 'object', 
        required: true,
        children: [
          { id: '5a', name: 'street', type: 'string', required: true },
          { id: '5b', name: 'city', type: 'string', required: true },
          { id: '5c', name: 'zipcode', type: 'string', required: true }
        ]
      },
      {
        id: '6',
        name: 'items',
        type: 'array',
        required: true,
        arrayItemType: 'object',
        children: [
          { id: '6a', name: 'productId', type: 'string', required: true },
          { id: '6b', name: 'productName', type: 'string', required: true },
          { id: '6c', name: 'price', type: 'number', required: true },
          { id: '6d', name: 'quantity', type: 'integer', required: true }
        ]
      }
    ] as unknown as ManualField[]
  },
  {
    id: 'fintech',
    title: 'Fintech Transactions',
    description: 'Bank accounts, split transactions, IBAN numbers, and currency balances.',
    icon: FileTerminal,
    color: 'text-green-400',
    fields: [
      { id: 't1', name: 'transactionRef', type: 'string', required: true },
      { id: 't2', name: 'timestamp', type: 'date', required: true }, 
      { id: 't3', name: 'senderIban', type: 'string', required: true },
      { id: 't4', name: 'receiverIban', type: 'string', required: true },
      { id: 't5', name: 'currency', type: 'string', required: true, enumValues: 'USD, EUR, GBP, TRY' },
      { id: 't6', name: 'amount', type: 'number', required: true },
      { id: 't7', name: 'fee', type: 'formula', required: true, formula: 'Number(row.amount * 0.05).toFixed(2)' },
      { id: 't8', name: 'successful', type: 'boolean', required: true }
    ] as unknown as ManualField[]
  },
  {
    id: 'iot',
    title: 'IoT Telemetry Sensors',
    description: 'Timeseries sensor metrics with randomized latency and device states.',
    icon: Cpu,
    color: 'text-blue-400',
    fields: [
      { id: 'i1', name: 'deviceId', type: 'string', required: true },
      { id: 'i2', name: 'timestamp', type: 'date', required: true },
      { id: 'i3', name: 'temperature', type: 'number', required: true },
      { id: 'i4', name: 'humidity', type: 'number', required: true },
      { id: 'i5', name: 'batteryLevel', type: 'integer', required: true, minimum: 0, maximum: 100 },
      { id: 'i6', name: 'firmwareVersion', type: 'string', required: true, enumValues: 'v1.0.0, v1.1.2, v2.0.0-rc1' },
      { id: 'i7', name: 'isOnline', type: 'boolean', required: true }
    ] as unknown as ManualField[]
  }
];

export function TemplateGallery({ isOpen, onClose, onSelect }: TemplateGalleryProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden"
        >
          <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
            <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-purple-400" />
              Template Gallery
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-md text-gray-400 hover:text-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            <p className="text-gray-400 text-sm mb-6">
              Load a pre-configured data schema to instantly kickstart your project. 
              <strong className="text-yellow-500 block mt-1">Warning: Loading a template will replace your current schema.</strong>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelect(template.fields);
                    onClose();
                  }}
                  className="flex flex-col text-left p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-purple-500/50 hover:bg-gray-800 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gray-900 rounded-md group-hover:scale-110 transition-transform">
                      <template.icon className={`w-5 h-5 ${template.color}`} />
                    </div>
                    <span className="font-semibold text-gray-200">{template.title}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {template.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-gray-700/50 text-[10px] uppercase font-bold text-gray-500 flex items-center justify-between">
                    <span>{template.fields.length} Fields</span>
                    <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">Apply →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
