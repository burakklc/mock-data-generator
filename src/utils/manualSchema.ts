import type { ManualField, SchemaGenerationResult } from '../types';

function convertFieldToSchema(field: ManualField, errors: string[]): Record<string, unknown> | null {
  if (!field.name.trim()) {
    errors.push('İsimsiz alanlar yok sayıldı.');
    return null;
  }

  // Handle formula type (custom extension for generator)
  if (field.type === 'formula') {
    return {
      type: 'string', // formulas are computed as strings by default
      'x-formula': field.formula || ''
    };
  }

  // Handle Fintech and special string types
  if (field.type === 'uuid') return { type: 'string', faker: 'string.uuid' };
  if (field.type === 'iban') return { type: 'string', faker: 'finance.iban' };
  if (field.type === 'credit_card') return { type: 'string', faker: 'finance.creditCardNumber' };
  if (field.type === 'cvv') return { type: 'string', faker: 'finance.creditCardCVV' };
  if (field.type === 'wallet_address') return { type: 'string', faker: 'finance.ethereumAddress' };
  if (field.type === 'currency_code') return { type: 'string', faker: 'finance.currencyCode' };

  const schema: Record<string, unknown> = { 
    type: field.type === 'date' ? 'string' : field.type 
  };

  if (field.type === 'date') schema.format = 'date-time';
  if (field.minLength != null) schema.minLength = field.minLength;
  if (field.maxLength != null) schema.maxLength = field.maxLength;
  if (field.pattern) schema.pattern = field.pattern;
  if (field.minimum != null) schema.minimum = field.minimum;
  if (field.maximum != null) schema.maximum = field.maximum;
  
  if (field.unique) {
    schema['x-unique'] = true; // custom marker for generator
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

  if (field.type === 'object') {
    schema.additionalProperties = false;
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    if (field.children) {
      field.children.forEach(child => {
        const childSchema = convertFieldToSchema(child, errors);
        if (childSchema) {
          properties[child.name] = childSchema;
          if (child.required) required.push(child.name);
        }
      });
    }
    schema.properties = properties;
    if (required.length > 0) schema.required = required;
  }

  if (field.type === 'array') {
    if (field.unique) {
      schema.uniqueItems = true;
    }
    
    const itemType = field.arrayItemType || 'string';
    const itemsSchema: Record<string, unknown> = {
      type: itemType === 'date' ? 'string' : itemType
    };
    if (itemType === 'date') itemsSchema.format = 'date-time';

    if (itemType === 'object' && field.children) {
      itemsSchema.additionalProperties = false;
      const properties: Record<string, any> = {};
      const required: string[] = [];
      
      field.children.forEach(child => {
        const childSchema = convertFieldToSchema(child, errors);
        if (childSchema) {
          properties[child.name] = childSchema;
          if (child.required) required.push(child.name);
        }
      });
      itemsSchema.properties = properties;
      if (required.length > 0) itemsSchema.required = required;
    }
    schema.items = itemsSchema;
  }

  return schema;
}

export function manualFieldsToSchema(fields: ManualField[]): SchemaGenerationResult {
  const properties: Record<string, any> = {};
  const required: string[] = [];
  const errors: string[] = [];

  fields.forEach((field) => {
    const fieldSchema = convertFieldToSchema(field, errors);
    if (fieldSchema) {
      properties[field.name] = fieldSchema;
      if (field.required) {
        required.push(field.name);
      }
    }
  });

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties,
    required: required.length > 0 ? required : undefined
  };

  return { schema, errors };
}
