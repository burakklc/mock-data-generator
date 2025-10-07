import jsf from 'json-schema-faker';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

jsf.option({
  alwaysFakeOptionals: true,
  fillProperties: true,
  useExamplesValue: true,
  useDefaultValue: true,
});

export interface GenerationOutcome {
  records: any[];
  validationErrors: string[];
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

export async function generateRecords(schema: any, count: number, edgeCases: boolean): Promise<GenerationOutcome> {
  const records: any[] = [];
  const generator = async () => jsf.resolve(schema);
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const record = await generator();
    records.push(record);
  }
  if (edgeCases) {
    records.push(createEdgeCaseRecord(schema));
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
