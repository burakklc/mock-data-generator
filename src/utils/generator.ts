import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import RandExp from 'randexp';

const currentYear = new Date().getFullYear();

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

export interface ValidationIssue {
  instancePath: string;
  displayPath: string;
  keyword: string;
  message: string;
  suggestion: string | null;
  schemaPath: string;
  recordNumber: number;
}

export interface GenerationOutcome {
  records: any[];
  validationErrors: ValidationIssue[];
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

function getKeyTokens(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-z0-9]+/gi, '_')
    .toLowerCase()
    .split('_')
    .filter(Boolean);
}

function decodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

function formatInstancePath(instancePath: string): string {
  if (!instancePath) {
    return 'kök';
  }
  const segments = instancePath.split('/').slice(1).map(decodeJsonPointerSegment);
  let formatted = '';
  segments.forEach((segment) => {
    if (/^\d+$/.test(segment)) {
      formatted += `[${segment}]`;
    } else if (formatted.length === 0) {
      formatted = segment;
    } else {
      formatted += `.${segment}`;
    }
  });
  return formatted || 'kök';
}

function randomNumberInRange(
  min: number,
  max: number,
  integer: boolean,
  decimals?: number,
): number {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return integer ? 0 : 0;
  }
  if (min === max) {
    return integer ? Math.round(min) : min;
  }
  let rangeMin = Math.min(min, max);
  let rangeMax = Math.max(min, max);
  if (!Number.isFinite(rangeMin) && Number.isFinite(rangeMax)) {
    rangeMin = rangeMax - 10;
  } else if (!Number.isFinite(rangeMax) && Number.isFinite(rangeMin)) {
    rangeMax = rangeMin + 10;
  }
  const random = rangeMin + Math.random() * (rangeMax - rangeMin);
  if (integer) {
    return Math.round(random);
  }
  if (typeof decimals === 'number') {
    return Number(random.toFixed(decimals));
  }
  return Number(random.toFixed(6));
}

interface NumberAdjustmentOptions {
  defaultMin?: number;
  defaultMax?: number;
  integer?: boolean;
  decimals?: number;
  preferPositive?: boolean;
}

function ensureNumberInRange(
  value: unknown,
  schema: any,
  options: NumberAdjustmentOptions,
): unknown {
  const schemaTypes = toTypeList(schema?.type);
  const preferInteger = options.integer ?? schemaTypes.includes('integer');
  const hasNumberType = schemaTypes.includes('number') || schemaTypes.includes('integer');

  const numericValue =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : hasNumberType
      ? Number(value)
      : Number.NaN;
  const valueIsFinite = Number.isFinite(numericValue);

  let min =
    typeof schema?.minimum === 'number' ? schema.minimum : undefined;
  let max =
    typeof schema?.maximum === 'number' ? schema.maximum : undefined;

  if (typeof schema?.exclusiveMinimum === 'number') {
    const exclusiveMin = schema.exclusiveMinimum;
    const candidate = preferInteger
      ? Math.floor(exclusiveMin) + 1
      : exclusiveMin + Number.EPSILON;
    min = min != null ? Math.max(min, candidate) : candidate;
  }

  if (typeof schema?.exclusiveMaximum === 'number') {
    const exclusiveMax = schema.exclusiveMaximum;
    const candidate = preferInteger
      ? Math.ceil(exclusiveMax) - 1
      : exclusiveMax - Number.EPSILON;
    max = max != null ? Math.min(max, candidate) : candidate;
  }

  if (min == null && options.defaultMin != null) {
    min = options.defaultMin;
  }
  if (max == null && options.defaultMax != null) {
    max = options.defaultMax;
  }

  if (options.preferPositive && (min == null || min < 0)) {
    min = Math.max(min ?? 0, 0);
  }

  if (min != null && max != null && min > max) {
    const midpoint = (min + max) / 2;
    min = Math.min(min, midpoint);
    max = Math.max(max, midpoint);
  }

  const withinRange =
    valueIsFinite &&
    (min == null || numericValue >= min) &&
    (max == null || numericValue <= max);

  if (withinRange) {
    if (preferInteger) {
      return Math.round(numericValue);
    }
    if (options.decimals != null) {
      return Number(numericValue.toFixed(options.decimals));
    }
    return numericValue;
  }

  if (min == null && max == null) {
    if (!valueIsFinite) {
      return preferInteger ? 0 : 0;
    }
    return preferInteger ? Math.round(numericValue) : numericValue;
  }

  const effectiveMin = min ?? (max != null ? max - 10 : 0);
  const effectiveMax = max ?? (min != null ? min + 10 : 1);
  return randomNumberInRange(effectiveMin, effectiveMax, preferInteger, options.decimals);
}

function buildSuggestion(error: ErrorObject): string | null {
  const params = (error.params || {}) as Record<string, unknown>;
  const parentSchema = (error as any).parentSchema || {};

  switch (error.keyword) {
    case 'required': {
      const missing = params.missingProperty as string | undefined;
      return missing
        ? `"${missing}" alanını ekleyin ve şemadaki gereksinimleri karşılayacak şekilde doldurun.`
        : 'Eksik alanı ekleyin ve gerekli bilgileri sağlayın.';
    }
    case 'type': {
      const expected = params.type as string | undefined;
      return expected
        ? `Değeri ${expected} tipine dönüştürün veya şemada izin verilen tipe göre güncelleyin.`
        : 'Değeri beklenen tipe uygun hale getirin.';
    }
    case 'minLength': {
      const limit = params.limit as number | undefined;
      return limit != null
        ? `En az ${limit} karakter olacak şekilde değeri uzatın.`
        : 'Değerin uzunluğunu artırın.';
    }
    case 'maxLength': {
      const limit = params.limit as number | undefined;
      return limit != null
        ? `Değeri ${limit} karakteri geçmeyecek şekilde kısaltın.`
        : 'Değerin uzunluğunu kısaltın.';
    }
    case 'pattern': {
      const pattern = parentSchema?.pattern;
      return pattern
        ? `Değeri '${pattern}' desenine uyacak biçimde güncelleyin.`
        : 'Değerin beklenen formata uygun olduğundan emin olun.';
    }
    case 'format': {
      const format = params.format as string | undefined;
      return format
        ? `Değeri geçerli bir ${format} formatına dönüştürün.`
        : 'Değeri şemada beklenen formata uygun hale getirin.';
    }
    case 'minimum':
    case 'exclusiveMinimum': {
      const limit = params.limit as number | undefined;
      return limit != null
        ? `Değeri ${error.keyword === 'exclusiveMinimum' ? '>' : '>='} ${limit} olacak şekilde artırın.`
        : 'Değerin alt sınırı karşılandığından emin olun.';
    }
    case 'maximum':
    case 'exclusiveMaximum': {
      const limit = params.limit as number | undefined;
      return limit != null
        ? `Değeri ${error.keyword === 'exclusiveMaximum' ? '<' : '<='} ${limit} olacak şekilde azaltın.`
        : 'Değerin üst sınırı karşılandığından emin olun.';
    }
    case 'multipleOf': {
      const factor = params.multipleOf as number | undefined;
      return factor != null
        ? `Değeri ${factor} katsayısının katı olacak şekilde ayarlayın.`
        : 'Değeri belirtilen çarpanla uyumlu hale getirin.';
    }
    case 'minItems': {
      const limit = params.limit as number | undefined;
      return limit != null
        ? `Diziye en az ${limit} öğe ekleyin.`
        : 'Dizi eleman sayısını artırın.';
    }
    case 'maxItems': {
      const limit = params.limit as number | undefined;
      return limit != null
        ? `Dizi eleman sayısını ${limit} değerini aşmayacak şekilde azaltın.`
        : 'Dizi eleman sayısını azaltın.';
    }
    case 'uniqueItems':
      return 'Dizi içindeki tekrar eden değerleri kaldırarak benzersiz hale getirin.';
    case 'minProperties': {
      const limit = params.limit as number | undefined;
      return limit != null
        ? `Objeye en az ${limit} adet alan ekleyin.`
        : 'Objeye gerekli alanları ekleyin.';
    }
    case 'maxProperties': {
      const limit = params.limit as number | undefined;
      return limit != null
        ? `Objedeki alan sayısını ${limit} değerini aşmayacak şekilde azaltın.`
        : 'Objedeki gereksiz alanları kaldırın.';
    }
    case 'additionalProperties': {
      const property = params.additionalProperty as string | undefined;
      return property
        ? `"${property}" alanını kaldırın veya şemada izin verilen alanlar listesine ekleyin.`
        : 'Şemanın tanımlamadığı alanları kaldırın.';
    }
    case 'const': {
      const allowed = params.allowedValue;
      return allowed !== undefined
        ? `Değeri ${JSON.stringify(allowed)} olarak ayarlayın.`
        : 'Değeri şemadaki sabit değere eşitleyin.';
    }
    case 'enum': {
      const allowed = parentSchema?.enum as unknown[] | undefined;
      return allowed && allowed.length
        ? `Değeri izin verilen seçeneklerden biriyle değiştirin: ${allowed
            .slice(0, 5)
            .map((value) => JSON.stringify(value))
            .join(', ')}${allowed.length > 5 ? ', ...' : ''}.`
        : 'Değeri şemada belirtilen seçeneklerden biriyle değiştirin.';
    }
    case 'dependentRequired': {
      const deps = params.deps as string | undefined;
      const property = params.property as string | undefined;
      return property && deps
        ? `"${property}" alanı kullanılıyorsa "${deps}" alanını da ekleyin.`
        : 'Bağımlı alanların birlikte tanımlandığından emin olun.';
    }
    default:
      return 'Değeri şema kurallarına uygun hale getirin.';
  }
}

function adjustValueForSemanticHint(
  key: string,
  schema: any,
  value: unknown,
): unknown {
  if (value == null) {
    return value;
  }

  if (schema?.enum || schema?.const) {
    return value;
  }

  const schemaTypes = toTypeList(schema?.type);
  const isNumberLike =
    schemaTypes.includes('number') ||
    schemaTypes.includes('integer') ||
    typeof value === 'number';

  const tokens = getKeyTokens(key);
  if (tokens.length === 0) {
    return value;
  }

  if (
    tokens.some((token) =>
      ['age', 'ages', 'yas', 'yasi', 'yaslar'].includes(token),
    )
  ) {
    if (!isNumberLike) {
      return value;
    }
    return ensureNumberInRange(value, schema, {
      defaultMin: 0,
      defaultMax: 120,
      integer: true,
    });
  }

  if (tokens.includes('year') || tokens.includes('yil')) {
    if (!isNumberLike) {
      return value;
    }
    const relatesToBirth = tokens.some((token) =>
      ['birth', 'dob', 'dogum', 'dogumyili'].includes(token),
    );
    return ensureNumberInRange(value, schema, {
      defaultMin: relatesToBirth ? currentYear - 100 : 1970,
      defaultMax: relatesToBirth ? currentYear - 10 : currentYear + 1,
      integer: true,
    });
  }

  if (
    tokens.some((token) =>
      [
        'price',
        'cost',
        'amount',
        'total',
        'salary',
        'revenue',
        'budget',
        'fee',
        'balance',
      ].includes(token),
    )
  ) {
    if (!isNumberLike) {
      return value;
    }
    const schemaTypes = toTypeList(schema?.type);
    const isInteger = schemaTypes.includes('integer');
    const decimals = !isInteger ? 2 : undefined;
    return ensureNumberInRange(value, schema, {
      defaultMin: 0,
      defaultMax: schema?.maximum ?? 10000,
      integer: isInteger,
      decimals,
      preferPositive: true,
    });
  }

  if (
    tokens.some((token) =>
      ['percent', 'percentage', 'ratio', 'rate'].includes(token),
    )
  ) {
    if (!isNumberLike) {
      return value;
    }
    const schemaTypes = toTypeList(schema?.type);
    const isInteger = schemaTypes.includes('integer');
    return ensureNumberInRange(value, schema, {
      defaultMin: 0,
      defaultMax: 100,
      integer: isInteger,
      decimals: isInteger ? undefined : 2,
    });
  }

  if (
    tokens.some((token) =>
      ['count', 'quantity', 'qty', 'adet', 'items'].includes(token),
    )
  ) {
    if (!isNumberLike) {
      return value;
    }
    return ensureNumberInRange(value, schema, {
      defaultMin: 0,
      defaultMax: schema?.maximum ?? 1000,
      integer: true,
    });
  }

  return value;
}

function resolvePropertySchema(schema: any, key: string): any {
  if (!schema) {
    return undefined;
  }

  if (schema.properties && key in schema.properties) {
    return schema.properties[key];
  }

  if (schema.patternProperties) {
    for (const [pattern, propertySchema] of Object.entries(schema.patternProperties)) {
      try {
        const matcher = new RegExp(pattern);
        if (matcher.test(key)) {
          return propertySchema;
        }
      } catch {
        /* ignore invalid pattern property */
      }
    }
  }

  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    return schema.additionalProperties;
  }

  return undefined;
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

    Object.entries(result).forEach(([key, current]) => {
      const propertySchema = resolvePropertySchema(schema, key);
      const adjusted = adjustValueForSemanticHint(key, propertySchema, current);
      if (adjusted !== current) {
        result[key] = adjusted;
      }
    });

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

function formatAjvError(error: ErrorObject, recordIndex: number): ValidationIssue {
  const instancePath = error.instancePath || '';
  const displayPath = formatInstancePath(instancePath);
  const rawMessage = error.message || 'geçersiz değer';
  const schemaPath = error.schemaPath || '';
  const message = displayPath === 'kök' ? rawMessage : `${displayPath}: ${rawMessage}`;
  const suggestion = buildSuggestion(error);
  return {
    instancePath,
    displayPath,
    keyword: error.keyword,
    message,
    suggestion,
    schemaPath,
    recordNumber: recordIndex + 1,
  };
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
  const validationErrors: ValidationIssue[] = [];
  records.forEach((record, index) => {
    const valid = validator(record);
    if (!valid && validator.errors) {
      validator.errors.forEach((error) => {
        validationErrors.push(formatAjvError(error, index));
      });
    }
  });

  return { records, validationErrors };
}
