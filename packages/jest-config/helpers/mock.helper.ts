export type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? jest.Mock<R, A> : T[K];
};

export function createMock<T>(mock: Partial<Mocked<T>>): Mocked<T> {
  return mock as Mocked<T>;
}
