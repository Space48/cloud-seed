export type DeepPartial<T> = T extends Record<string, any>
  ? {
      [K in keyof T]?: DeepPartial<T[K]>;
    }
  : T;
