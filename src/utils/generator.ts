import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import RandExp from 'randexp';

const globalObject = globalThis as Record<string, any>;
if (!globalObject.process) {
  globalObject.process = { env: {} };
} else if (!globalObject.process.env) {
  globalObject.process.env = {};
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

type JsonSchemaFaker = typeof import('json-schema-faker')['default'];

let jsfPromise: Promise<JsonSchemaFaker> | null = null;

async function getJsonSchemaFaker(): Promise<JsonSchemaFaker> {
  if (!jsfPromise) {
    jsfPromise = (async () => {
      const module = await import('json-schema-faker');
      const instance = module.default;
      instance.option({
        alwaysFakeOptionals: true,
        fillProperties: true,
        useExamplesValue: true,
        useDefaultValue: true,
      });
      return instance;
    })();
  }
  return jsfPromise;
}

export interface GenerationOutcome {
  records: any[];
  validationErrors: string[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toTypeList(type: unknown): string[] {
  if (!type) {
    return [];
  }
  if (Array.isArray(type)) {
    return type.filter((item): item is string => typeof item === 'string');
  }
  return typeof type === 'string' ? [type] : [];
}

function ensurePatternValue(schema: any, current: unknown): string | undefined {
  const pattern = schema?.pattern;
  if (!pattern) {
    return typeof current === 'string' ? current : undefined;
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern);
  } catch {
    return typeof current === 'string' ? current : undefined;
  }

  if (schema?.enum && Array.isArray(schema.enum)) {
    const matching = schema.enum.find(
      (candidate: unknown) => typeof candidate === 'string' && regex.test(candidate),
    ) as string | undefined;
    if (matching) {
      return matching;
    }
  }

  if (typeof current === 'string' && regex.test(current)) {
    return current;
  }

  const rand = new RandExp(regex);
  const maxLength = typeof schema?.maxLength === 'number' ? schema.maxLength : undefined;
  const minLength = typeof schema?.minLength === 'number' ? schema.minLength : undefined;
  if (typeof maxLength === 'number') {
    rand.max = Math.max(maxLength, minLength ?? 0);
  } else if (typeof minLength === 'number') {
    rand.max = Math.max(16, minLength);
  } else {
    rand.max = 16;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const generated = rand.gen();
      if (
        typeof generated === 'string' &&
        (!maxLength || generated.length <= maxLength) &&
        (!minLength || generated.length >= minLength) &&
        regex.test(generated)
      ) {
        return generated;
      }
    } catch {
      break;
    }
  }

  return typeof current === 'string' && current.length > 0 ? current : undefined;
}

function applyPatternAwareValues(schema: any, value: unknown): unknown {
  if (!schema || value === null || value === undefined) {
    return value;
  }

  if (schema.allOf && Array.isArray(schema.allOf)) {
    return schema.allOf.reduce(
      (acc: unknown, part: any) => applyPatternAwareValues(part, acc),
      value,
    );
  }

  const types = toTypeList(schema.type);

  if (isPlainObject(value) && (types.includes('object') || schema.properties)) {
    const result: Record<string, unknown> = { ...value };
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, propertySchema]) => {
        if (key in result) {
          result[key] = applyPatternAwareValues(propertySchema, result[key]);
        }
      });
    }
    if (schema.patternProperties) {
      Object.entries(schema.patternProperties).forEach(([pattern, propertySchema]) => {
        try {
          const matcher = new RegExp(pattern);
          Object.keys(result).forEach((key) => {
            if (matcher.test(key)) {
              result[key] = applyPatternAwareValues(propertySchema, result[key]);
            }
          });
        } catch {
          /* ignore invalid pattern property */
        }
      });
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      Object.keys(result).forEach((key) => {
        if (!schema.properties || !(key in schema.properties)) {
          result[key] = applyPatternAwareValues(schema.additionalProperties, result[key]);
        }
      });
    }
    return result;
  }

  if (Array.isArray(value) && (types.includes('array') || schema.items)) {
    const resolveItemSchema = (index: number) => {
      if (Array.isArray(schema.items)) {
        return schema.items[index] ?? schema.items[schema.items.length - 1];
      }
      return schema.items;
    };
    return value.map((item, index) =>
      applyPatternAwareValues(resolveItemSchema(index), item),
    );
  }

  if (types.includes('string') || typeof value === 'string' || schema.pattern) {
    const next = ensurePatternValue(schema, value);
    if (next !== undefined) {
      return next;
    }
    if (typeof value === 'string') {
      return value;
    }
  }

  return value;
}

function makeEdgeCaseValue(schema: any): unknown {
  if (!schema) return null;
  const { type } = schema;
  if (Array.isArray(type)) {
    return makeEdgeCaseValue({ ...schema, type: type.find((t) => t !== 'null') });
  }
  switch (type) {
    case 'string': {
      if (schema.minLength != null && schema.minLength > 0) {
        return 'a'.repeat(Math.max(0, schema.minLength - 1));
      }
      if (schema.maxLength != null) {
        return 'a'.repeat(schema.maxLength + 1);
      }
      if (schema.enum) {
        return 'unexpected-value';
      }
      if (schema.pattern) {
        return 'pattern-mismatch';
      }
      if (schema.format === 'date' || schema.format === 'date-time') {
        return '';
      }
      return '';
    }
    case 'number':
    case 'integer': {
      if (schema.minimum != null) {
        return schema.minimum - 1;
      }
      if (schema.maximum != null) {
        return schema.maximum + 1;
      }
      return Number.NaN;
    }
    case 'boolean':
      return null;
    case 'array':
      if (schema.minItems && schema.minItems > 0) {
        return [];
      }
      return [{}];
    case 'object': {
      const edgeRecord: Record<string, unknown> = {};
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, childSchema]) => {
          edgeRecord[key] = makeEdgeCaseValue(childSchema);
        });
      }
      return edgeRecord;
    }
    default:
      return null;
  }
}

function createEdgeCaseRecord(schema: any): Record<string, unknown> {
  if (!schema || schema.type !== 'object') {
    return {};
  }
  const record: Record<string, unknown> = {};
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, propertySchema]) => {
      record[key] = makeEdgeCaseValue(propertySchema);
    });
  }
  return record;
}

function formatAjvError(error: ErrorObject): string {
  const path = error.instancePath || error.schemaPath;
  const message = error.message || 'geçersiz değer';
  return `${path} ${message}`;
}

export async function generateRecords(
  schema: any,
  count: number,
  edgeCaseRatio: number,
): Promise<GenerationOutcome> {
  const jsf = await getJsonSchemaFaker();
  const records: any[] = [];
  const generator = () => {
    const generated = jsf.generate(schema);
    return applyPatternAwareValues(schema, generated);
  };

  const targetEdgeCases = Math.min(count, Math.round((edgeCaseRatio / 100) * count));
  const baseCount = Math.max(0, count - targetEdgeCases);

  for (let i = 0; i < baseCount; i += 1) {
    const record = generator();
    records.push(record);
  }

  const edgeCaseRecords: any[] = [];
  const rootTypes = toTypeList(schema?.type);
  for (let i = 0; i < targetEdgeCases; i += 1) {
    if (rootTypes.includes('array')) {
      edgeCaseRecords.push([makeEdgeCaseValue(schema?.items)]);
    } else if (rootTypes.length > 0 && !rootTypes.includes('object')) {
      edgeCaseRecords.push(makeEdgeCaseValue(schema));
    } else {
      edgeCaseRecords.push(createEdgeCaseRecord(schema));
    }
  }

  edgeCaseRecords.forEach((edgeCase) => {
    const insertIndex = Math.floor(Math.random() * (records.length + 1));
    records.splice(insertIndex, 0, edgeCase);
  });

  while (records.length < count) {
    const record = generator();
    records.push(record);
  }

  const validator = ajv.compile(schema);
  const validationErrors: string[] = [];
  records.forEach((record, index) => {
    const valid = validator(record);
    if (!valid && validator.errors) {
      validator.errors.forEach((error) => {
        validationErrors.push(`Satır ${index + 1}: ${formatAjvError(error)}`);
      });
    }
  });

  return { records, validationErrors };
}
