import type { ColumnCheck, ColumnDefinition, SchemaGenerationResult } from '../types';

const typeMap: Record<string, { type: string; format?: string; minLength?: number; maxLength?: number }> = {
  int: { type: 'integer' },
  integer: { type: 'integer' },
  smallint: { type: 'integer' },
  bigint: { type: 'integer' },
  real: { type: 'number' },
  double: { type: 'number' },
  float: { type: 'number' },
  decimal: { type: 'number' },
  numeric: { type: 'number' },
  money: { type: 'number' },
  boolean: { type: 'boolean' },
  bool: { type: 'boolean' },
  text: { type: 'string' },
  varchar: { type: 'string' },
  char: { type: 'string' },
  nchar: { type: 'string' },
  nvarchar: { type: 'string' },
  date: { type: 'string', format: 'date' },
  datetime: { type: 'string', format: 'date-time' },
  timestamp: { type: 'string', format: 'date-time' }
};

function normaliseIdentifier(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('`') && trimmed.endsWith('`'))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function splitColumnDefinitions(columnsSection: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < columnsSection.length; i += 1) {
    const char = columnsSection[i];
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    } else if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim().length > 0) {
    result.push(current.trim());
  }
  return result;
}

function parseColumnDefinition(definition: string): ColumnDefinition | null {
  const trimmed = definition.trim();
  if (!trimmed) {
    return null;
  }
  const upper = trimmed.toUpperCase();
  if (upper.startsWith('PRIMARY KEY') || upper.startsWith('CONSTRAINT') || upper.startsWith('FOREIGN KEY')) {
    return null;
  }

  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 2) {
    return null;
  }
  const name = normaliseIdentifier(tokens[0]);
  const typeToken = tokens[1].toLowerCase();

  let baseType = typeToken;
  let lengthMatch: RegExpMatchArray | null = null;
  const lengthRegex = /([a-zA-Z]+)\((\d+)\)/;
  const lengthResult = typeToken.match(lengthRegex);
  if (lengthResult) {
    baseType = lengthResult[1];
    lengthMatch = lengthResult;
  }

  const mapping = typeMap[baseType];
  const notNull = upper.includes('NOT NULL');
  const checks: ColumnCheck[] = [];
  if (lengthMatch && mapping?.type === 'string') {
    const length = Number(lengthMatch[2]);
    checks.push({ kind: 'max', value: length });
  }

  const checkMatches = trimmed.match(/CHECK\s*\(([^)]+)\)/gi) || [];
  checkMatches.forEach((segment) => {
    const content = segment.replace(/CHECK\s*\(/i, '').replace(/\)$/i, '').trim();
    const comparison = content.match(/([\w"`]+)\s*(<=|>=|<|>|=)\s*([\w'.-]+)/);
    if (comparison) {
      const [, column, operator, valueToken] = comparison;
      if (normaliseIdentifier(column) === name) {
        const numericValue = Number(valueToken.replace(/'/g, ''));
        if (!Number.isNaN(numericValue)) {
          if (operator === '>=' || operator === '>') {
            checks.push({ kind: 'min', value: operator === '>' ? numericValue + 1 : numericValue });
          } else if (operator === '<=' || operator === '<') {
            checks.push({ kind: 'max', value: operator === '<' ? numericValue - 1 : numericValue });
          }
        }
      }
    }
  });

  return {
    name,
    type: baseType,
    notNull,
    checks
  };
}

export function parseCreateTableScript(script: string): SchemaGenerationResult {
  const errors: string[] = [];
  const cleaned = script.replace(/;\s*$/g, '').trim();
  const match = cleaned.match(/CREATE\s+TABLE\s+([\w"`]+)\s*\(([\s\S]+)\)/i);
  if (!match) {
    return { schema: null, errors: ['CREATE TABLE ifadesi çözümlenemedi.'], tableName: undefined };
  }

  const [, rawTableName, columnsSection] = match;
  const tableName = normaliseIdentifier(rawTableName);
  const columnDefinitions = splitColumnDefinitions(columnsSection)
    .map(parseColumnDefinition)
    .filter((column): column is ColumnDefinition => Boolean(column));

  if (columnDefinitions.length === 0) {
    errors.push('Tablo kolonları bulunamadı.');
  }

  const properties: Record<string, any> = {};
  const required: string[] = [];

  columnDefinitions.forEach((column) => {
    const mapping = typeMap[column.type] || { type: 'string' };
    const schema: Record<string, unknown> = { type: mapping.type };
    if (mapping.format) {
      schema.format = mapping.format;
    }
    column.checks.forEach((check) => {
      if (check.kind === 'min') {
        if (schema.type === 'string') {
          schema.minLength = check.value;
        } else {
          schema.minimum = check.value;
        }
      }
      if (check.kind === 'max') {
        if (schema.type === 'string') {
          schema.maxLength = check.value;
        } else {
          schema.maximum = check.value;
        }
      }
      if (check.kind === 'pattern' && schema.type === 'string') {
        schema.pattern = check.value;
      }
    });
    if (mapping.type === 'string' && column.type === 'string') {
      // no-op but keeps type inference happy
    }
    if (column.notNull) {
      required.push(column.name);
    }
    properties[column.name] = schema;
  });

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties,
    required
  };

  return { schema, tableName, errors };
}
