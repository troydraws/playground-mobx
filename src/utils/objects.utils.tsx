export function mergeIntoObjectByDescriptors<A extends AnyObject, B extends AnyObject>(
  a: A, b: B,
  options?: { configurable?: boolean }
) {
  const propertyDescriptorMap = Object.getOwnPropertyDescriptors(b);
  if (options) {
    if (options.configurable === true || options.configurable === false) {
      Object.values(propertyDescriptorMap).forEach(desc => desc.configurable = options.configurable);
    }
  }
  Object.defineProperties(a, propertyDescriptorMap);
  return a;
}