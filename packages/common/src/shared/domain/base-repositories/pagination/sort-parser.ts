// sort-parser.ts

export interface ParsedSort {
  field: string;
  direction: "asc" | "desc";
}

export class SortParser {
  static parse(sort?: string): ParsedSort | null {
    if (!sort) {
      return null;
    }

    const [field, direction] = sort.split(",");

    return {
      field,
      direction: direction?.toLowerCase() === "asc" ? "asc" : "desc",
    };
  }
}
