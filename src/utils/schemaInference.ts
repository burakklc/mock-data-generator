const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const DATE_TIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}:\d{2}$/;
const URI_REGEX = /^https?:\/\//i;

type JsonSchema = Record<string, unknown>;

function cloneSchema<T extends JsonSchema | undefined>(schema: T): T {
  if (!schema) {
    return schema;
  }
  return JSON.parse(JSON.stringify(schema)) as T;
}

function toTypeList(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return typeof value === 'string' ? [value] : [];
}

function uniqueExamples<T>(a: T[] = [], b: T[] = [], max = 5): T[] {
  const seen = new Set<T>();
  [...a, ...b].forEach((item) => {
    if (item !== undefined && item !== null) {
      seen.add(item);
    }
  });
  return Array.from(seen).slice(0, max);
}

function detectStringFormat(value: string): string | undefined {
  if (EMAIL_REGEX.test(value)) return 'email';
  if (URI_REGEX.test(value)) return 'uri';
  if (DATE_TIME_REGEX.test(value)) return 'date-time';
  if (DATE_REGEX.test(value)) return 'date';
  if (TIME_REGEX.test(value)) return 'time';
  return undefined;
}

function mergeRequired(first: string[] | undefined, second: string[] | undefined): string[] | undefined {
  if (!first || !second) {
    return undefined;
  }
  const intersection = first.filter((key) => second.includes(key));
  return intersection.length > 0 ? intersection : undefined;
}

function mergeSchemas(base: JsonSchema | undefined, addition: JsonSchema | undefined): JsonSchema | undefined {
  if (!base) {
    return cloneSchema(addition);
  }
  if (!addition) {
    return cloneSchema(base);
  }

  const baseTypes = toTypeList(base.type);
  const additionTypes = toTypeList(addition.type);

  const hasNumberIntegerCombination =
    (baseTypes.includes('integer') && additionTypes.includes('number')) ||
    (baseTypes.includes('number') && additionTypes.includes('integer'));

  const sharedType =
    baseTypes.find((type) => additionTypes.includes(type)) ??
    (hasNumberIntegerCombination ? 'number' : undefined);

  if (!sharedType) {
    return { anyOf: [cloneSchema(base), cloneSchema(addition)] };
  }

  const result: JsonSchema = { ...cloneSchema(base), type: sharedType };

  if (sharedType === 'object') {
    const baseProperties = (base.properties as Record<string, JsonSchema>) ?? {};
    const additionProperties = (addition.properties as Record<string, JsonSchema>) ?? {};
    const allKeys = new Set([...Object.keys(baseProperties), ...Object.keys(additionProperties)]);
    const mergedProperties: Record<string, JsonSchema> = {};
    allKeys.forEach((key) => {
      mergedProperties[key] = mergeSchemas(baseProperties[key], additionProperties[key]) ?? {};
    });
    result.properties = mergedProperties;
    const required = mergeRequired(
      (base.required as string[]) ?? Object.keys(baseProperties),
      (addition.required as string[]) ?? Object.keys(additionProperties),
    );
    if (required) {
      result.required = required;
    } else {
      delete result.required;
    }
    result.additionalProperties =
      typeof addition.additionalProperties === 'boolean'
        ? addition.additionalProperties
        : base.additionalProperties ?? false;
    return result;
  }

  if (sharedType === 'array') {
    const baseItems = base.items as JsonSchema | undefined;
    const additionItems = addition.items as JsonSchema | undefined;
    result.items = mergeSchemas(baseItems, additionItems) ?? {};
    return result;
  }

  if (sharedType === 'string') {
    result.examples = uniqueExamples(base.examples as string[], addition.examples as string[]);
    const baseFormat = base.format as string | undefined;
    const additionFormat = addition.format as string | undefined;
    if (baseFormat && additionFormat && baseFormat === additionFormat) {
      result.format = baseFormat;
    } else if (additionFormat && !baseFormat) {
      result.format = additionFormat;
    } else if (!additionFormat && baseFormat) {
      result.format = baseFormat;
    } else {
      delete result.format;
    }
    return result;
  }

  if (sharedType === 'number' || sharedType === 'integer') {
    const numericExamples = uniqueExamples<number>(
      base.examples as number[],
      addition.examples as number[],
    );
    if (numericExamples.length > 0) {
      result.examples = numericExamples;
    }
    const minima = [base.minimum, addition.minimum].filter((value): value is number => typeof value === 'number');
    const maxima = [base.maximum, addition.maximum].filter((value): value is number => typeof value === 'number');
    if (minima.length > 0) {
      result.minimum = Math.min(...minima);
    }
    if (maxima.length > 0) {
      result.maximum = Math.max(...maxima);
    }
    result.type = sharedType === 'integer' && base.type === 'integer' && addition.type === 'integer' ? 'integer' : 'number';
    return result;
  }

  if (sharedType === 'boolean') {
    result.examples = uniqueExamples<boolean>(
      base.examples as boolean[],
      addition.examples as boolean[],
    );
    return result;
  }

  if (sharedType === 'null') {
    return { type: 'null' };
  }

  return result;
}

function inferSchemaInternal(sample: unknown): JsonSchema {
  if (sample === null) {
    return { type: 'null' };
  }

  if (Array.isArray(sample)) {
    if (sample.length === 0) {
      return { type: 'array', items: {} };
    }
    const mergedItems = sample.reduce<JsonSchema | undefined>((acc, item) => {
      const itemSchema = inferSchemaInternal(item);
      return mergeSchemas(acc, itemSchema);
    }, undefined);
    return {
      type: 'array',
      items: mergedItems ?? {},
    };
  }

  if (typeof sample === 'object') {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    Object.entries(sample as Record<string, unknown>).forEach(([key, value]) => {
      properties[key] = inferSchemaInternal(value);
      required.push(key);
    });
    const schema: JsonSchema = {
      type: 'object',
      properties,
      additionalProperties: false,
    };
    if (required.length > 0) {
      schema.required = required;
    }
    return schema;
  }

  if (typeof sample === 'string') {
    const schema: JsonSchema = {
      type: 'string',
      examples: [sample],
    };
    const inferredFormat = detectStringFormat(sample);
    if (inferredFormat) {
      schema.format = inferredFormat;
    }
    return schema;
  }

  if (typeof sample === 'number') {
    const baseType = Number.isInteger(sample) ? 'integer' : 'number';
    return {
      type: baseType,
      minimum: sample,
      maximum: sample,
      examples: [sample],
    };
  }

  if (typeof sample === 'boolean') {
    return {
      type: 'boolean',
      examples: [sample],
    };
  }

  return {};
}

export function inferSchemaFromSample(sample: unknown): JsonSchema {
  const coreSchema = inferSchemaInternal(sample);
  const schema: JsonSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...coreSchema,
  };
  return schema;
}
