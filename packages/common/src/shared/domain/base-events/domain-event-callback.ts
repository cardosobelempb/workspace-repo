import { RootEvent } from "./root.event";

/**
 * Callback tipado para eventos de domínio
 */
export type DomainEventCallback<E extends RootEvent = RootEvent> = (event: E) => void;
