import { saveAs } from './fileSaver';

export function toJsonString(records: unknown[]): string {
  return JSON.stringify(records, null, 2);
}

export function toCsvString(records: Array<Record<string, unknown>>): string {
  if (!records.length) {
    return '';
  }

  const headers = Array.from(
    records.reduce((set, record) => {
      Object.keys(record ?? {}).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const escape = (value: unknown) => {
    if (value == null) {
      return '';
    }
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const rows = records.map((record) => {
    const safeRecord = record ?? {};
    return headers.map((header) => escape((safeRecord as Record<string, unknown>)[header])).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function toSqlInsert(records: Array<Record<string, unknown>>, tableName: string): string {
  if (!records.length) {
    return '';
  }

  const columns = Array.from(
    records.reduce((set, record) => {
      Object.keys(record ?? {}).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const rows = records
    .map((record) => {
      const safeRecord = record ?? {};
      const values = columns
        .map((column) => formatSqlValue((safeRecord as Record<string, unknown>)[column]))
        .join(', ');
      return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
    })
    .join('\n');

  return rows;
}

function formatSqlValue(value: unknown): string {
  if (value === undefined || value === null || (typeof value === 'number' && Number.isNaN(value))) {
    return 'NULL';
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  return `'${stringValue.replace(/'/g, "''")}'`;
}

export function downloadJson(records: unknown[], filename = 'mock-data.json'): void {
  saveAs(new Blob([toJsonString(records)], { type: 'application/json' }), filename);
}

export function downloadCsv(records: Array<Record<string, unknown>>, filename = 'mock-data.csv'): void {
  saveAs(new Blob([toCsvString(records)], { type: 'text/csv' }), filename);
}

export function downloadSql(
  records: Array<Record<string, unknown>>,
  tableName: string,
  filename = 'mock-data.sql',
): void {
  saveAs(new Blob([toSqlInsert(records, tableName)], { type: 'text/plain' }), filename);
}
