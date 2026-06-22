import { StandardError, ValidationError } from "@repo/common";

export function errorHandler(err: any, req: any, res: any) {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).send({
      ...err.toJSON(),
      path: req.url,
    });
  }

  if (err instanceof StandardError) {
    return res.status(err.statusCode).send({
      ...err.toJSON(),
      path: req.url,
    });
  }

  return res.status(500).send({
    statusCode: 500,
    error: "Internal Server Error",
    message: err?.message ?? "Unexpected error",
    code: "INTERNAL_SERVER_ERROR",
    path: req.url,
    timestamp: new Date().toISOString(),
  });
}
