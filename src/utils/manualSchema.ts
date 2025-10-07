import type { ManualField, SchemaGenerationResult } from '../types';

export function manualFieldsToSchema(fields: ManualField[]): SchemaGenerationResult {
  const properties: Record<string, any> = {};
  const required: string[] = [];
  const errors: string[] = [];

  fields.forEach((field) => {
    if (!field.name.trim()) {
      errors.push('İsimsiz alanlar yok sayıldı.');
      return;
    }
    const schema: Record<string, unknown> = { type: field.type === 'date' ? 'string' : field.type };
    if (field.type === 'date') {
      schema.format = 'date-time';
    }
    if (field.minLength != null) {
      schema.minLength = field.minLength;
    }
    if (field.maxLength != null) {
      schema.maxLength = field.maxLength;
    }
    if (field.pattern) {
      schema.pattern = field.pattern;
    }
    if (field.minimum != null) {
      schema.minimum = field.minimum;
    }
    if (field.maximum != null) {
      schema.maximum = field.maximum;
    }
    if (field.enumValues) {
      const values = field.enumValues
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      if (values.length > 0) {
        schema.enum = values;
      }
    }
    properties[field.name] = schema;
    if (field.required) {
      required.push(field.name);
    }
  });

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties,
    required
  };

  return { schema, errors };
}
