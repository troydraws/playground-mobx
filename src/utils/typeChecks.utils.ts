export function isString(v: any): v is string {
  return typeof v === 'string';
}
/**
 * checks if given value is an object. `null` will return false, and arrays will return true;
 */
export function isObject<T extends AnyObject>(v: any): v is T {
  if (v === null) return false;
  return v instanceof Object
}
export function isFunction(v: any): v is Function {
  return typeof v === 'function';
}
export function isAsyncFunction(fn?: Function): fn is ((...args: any) => Promise<any>) {
  return fn?.constructor?.name === 'AsyncFunction'
}
export function isGeneratorFunction(fn?: Function) {
  return fn?.constructor?.name === 'AsyncFunction'
}
export function isReactComponentClass(component: unknown): component is React.ComponentClass {
  return (
    typeof component === 'function' &&
    !!component?.prototype?.isReactComponent
  )
}
/**
 * native arrows don't have prototypes; class components have special prototype property 'isReactComponent'
 */
export function isReactFunctionalComponent(component: unknown): component is React.FC {
  if (!component) return false;
  return (
    typeof component === 'function' // can be various things
    && (!component?.prototype || !component?.prototype?.isReactComponent)
  );
}

export function isReactComponent(component: unknown): component is React.ComponentClass | React.FC {
  return (
    isReactComponentClass(component) ||
    isReactFunctionalComponent(component)
  )
}

export function isLazyComponent<T extends React.FunctionComponent | React.ComponentClass = any>(component: unknown): component is React.LazyExoticComponent<T> {
  return isObject(component) && component?.$$typeof?.toString() === 'Symbol(react.lazy)';
}

export function isMemoizedComponent(component: unknown): component is React.NamedExoticComponent {
  return isObject(component) && component?.$$typeof?.toString() === 'Symbol(react.memo)';
}

export const isAnyReactComponent = (component: unknown) => {
  return isObject(component) && (
    true
  )
}