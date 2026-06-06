import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContextData = {
  requestId: string;
  traceId?: string;
  userId?: string;
  tenantId?: string;
  organizationId?: string;
};

export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestContextData>();

  static run<T>(data: RequestContextData, callback: () => T): T {
    return this.storage.run(data, callback);
  }

  static get(): RequestContextData | undefined {
    return this.storage.getStore();
  }

  static getRequestId(): string | undefined {
    return this.get()?.requestId;
  }

  static getTraceId(): string | undefined {
    return this.get()?.traceId;
  }

  static getUserId(): string | undefined {
    return this.get()?.userId;
  }
}
