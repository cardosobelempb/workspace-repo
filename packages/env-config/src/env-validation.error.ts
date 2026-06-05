type FieldError = {
  field: string;
  message: string;
};

export class EnvValidationError extends Error {
  private readonly fieldErrors: FieldError[] = [];
  readonly timestamp = new Date();
  readonly statusCode = 400;
  readonly code = "EnvValidationError";
  readonly error = "Validation Error";
  readonly path?: string;

  constructor(path?: string) {
    super("Dados inválidos");
    this.name = "EnvValidationError";

    if (path) {
      this.path = path;
    }
  }

  addFieldError(field: string, message: string): this {
    this.fieldErrors.push({ field, message });
    return this;
  }

  getIssues(): FieldError[] {
    return [...this.fieldErrors];
  }

  toJSON() {
    const issues = this.getIssues();
    const firstFieldName = issues[0]?.field;

    return {
      name: this.name,
      statusCode: this.statusCode,
      error: this.error,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      code: this.code,
      ...(this.path && { path: this.path }),
      ...(firstFieldName && { fieldName: firstFieldName }),
      ...(issues.length > 0 && { issues }),
    };
  }
}
