// filter.types.ts

export type FilterOperator =
  | "eq"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in";

export interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}
