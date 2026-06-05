export type WhereFilter<T> = {
  [K in keyof T]?: T[K] | FilterOperators<T[K]>;
};

type BaseValue<T> = NonNullable<T>;
type NullablePart<T> = null extends T ? null : never;

type FilterOperators<T> = {
  gt?: BaseValue<T>;
  gte?: BaseValue<T>;
  lt?: BaseValue<T>;
  lte?: BaseValue<T>;
  in?: BaseValue<T>[];
  notIn?: BaseValue<T>[];
  contains?: BaseValue<T> extends string ? string : never;
  not?: BaseValue<T> | NullablePart<T>;
};
