declare module 'json-source-map' {
  export interface PointerPosition {
    line: number;
    column: number;
    pos: number;
  }

  export interface PointerDetails {
    value?: PointerPosition;
    key?: PointerPosition;
  }

  export interface ParseResult<T = unknown> {
    data: T;
    pointers: Record<string, PointerDetails>;
  }

  export function parse<T = unknown>(source: string, reviver?: unknown, options?: unknown): ParseResult<T>;
}
