export type GeneratorMode = 'jsonSchema' | 'createTable' | 'manual';

export interface ManualField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'date';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enumValues?: string;
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
