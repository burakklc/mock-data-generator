import yaml from 'js-yaml';
import { XMLParser } from 'fast-xml-parser';

export type ImportFormat = 'json' | 'csv' | 'xml' | 'yaml';

export interface ImportResult {
    data: any[];
    error?: string;
}

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
});

export function parseInput(input: string, format: ImportFormat): ImportResult {
    try {
        if (!input.trim()) {
            return { data: [] };
        }

        switch (format) {
            case 'json':
                return parseJson(input);
            case 'csv':
                return parseCsv(input);
            case 'xml':
                return parseXml(input);
            case 'yaml':
                return parseYaml(input);
            default:
                return { data: [], error: 'Unsupported format' };
        }
    } catch (err) {
        return { data: [], error: (err as Error).message };
    }
}

function parseJson(input: string): ImportResult {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
        return { data: parsed };
    }
    return { data: [parsed] };
}

function parseCsv(input: string): ImportResult {
    const lines = input.trim().split('\n');
    if (lines.length < 2) return { data: [] };

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const data = lines.slice(1).map((line) => {
        // Basic CSV parsing - doesn't handle commas inside quotes perfectly, 
        // but good enough for simple mock data
        const values = line.split(',').map((v) => {
            const val = v.trim();
            if (val.startsWith('"') && val.endsWith('"')) {
                return val.slice(1, -1).replace(/""/g, '"');
            }
            // Try to parse numbers/booleans
            if (!isNaN(Number(val)) && val !== '') return Number(val);
            if (val.toLowerCase() === 'true') return true;
            if (val.toLowerCase() === 'false') return false;
            return val;
        });

        const record: Record<string, any> = {};
        headers.forEach((header, index) => {
            if (index < values.length) {
                record[header] = values[index];
            }
        });
        return record;
    });

    return { data };
}

function parseXml(input: string): ImportResult {
    const parsed = xmlParser.parse(input);
    // Try to find the array in the XML structure
    // Usually it's root -> items -> item[] or similar
    const rootKeys = Object.keys(parsed);
    if (rootKeys.length === 1) {
        const root = parsed[rootKeys[0]];
        // If root is array (rare in XML)
        if (Array.isArray(root)) return { data: root };

        // Check for nested array property
        for (const key in root) {
            if (Array.isArray(root[key])) {
                return { data: root[key] };
            }
        }

        // If single object, wrap in array
        return { data: [root] };
    }
    return { data: [parsed] };
}

function parseYaml(input: string): ImportResult {
    const parsed = yaml.load(input);
    if (Array.isArray(parsed)) {
        return { data: parsed };
    }
    return { data: [parsed] };
}
