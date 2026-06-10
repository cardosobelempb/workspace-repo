export function mockStaticMethod<T>(target: object, method: string, value: T) {
  return jest.spyOn(target as any, method).mockReturnValue(value);
}
