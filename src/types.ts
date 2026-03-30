export type GeneratorMode = 'jsonSchema' | 'createTable' | 'manual' | 'graphql' | 'typescript';
export type Language = 'en' | 'tr';

export interface ManualField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'object' | 'array' | 'formula' | 'enum' | 'uuid' | 'iban' | 'credit_card' | 'cvv' | 'wallet_address' | 'currency_code';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enumValues?: string;
  children?: ManualField[];
  arrayItemType?: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'object';
  unique?: boolean;
  formula?: string;
}

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  responseType: 'array' | 'object';
  recordCount: number;
  status: number;
  latency: number;
  requiresAuth: boolean;
  fields: ManualField[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  notNull: boolean;
  checks: ColumnCheck[];
}

export type ColumnCheck =
  | { kind: 'min'; value: number }
  | { kind: 'max'; value: number }
  | { kind: 'pattern'; value: string };

export interface SchemaGenerationResult {
  schema: unknown;
  tableName?: string;
  errors: string[];
}
