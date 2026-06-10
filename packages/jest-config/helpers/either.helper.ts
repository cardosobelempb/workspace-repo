export function expectRight<T>(result: { isRight(): boolean; value: T }): T {
  expect(result.isRight()).toBe(true);
  return result.value;
}

export function expectLeft<T>(result: { isLeft(): boolean; value: T }): T {
  expect(result.isLeft()).toBe(true);
  return result.value;
}
