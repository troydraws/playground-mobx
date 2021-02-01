import { computed, extendObservable, isAction, isComputedProp, isObservableProp, observable, runInAction } from "mobx";
import { useLocalObservable } from "mobx-react-lite";
import type { Annotation } from "mobx/dist/internal";
import { useEffect, useState } from "react";
import { isDevelopment } from "./env.utils";
import { isFunction } from "./typeChecks.utils";

/**
 * 
 * A helper function to convert (typically) props object into an MobX observable state object.
 * Everytime the component rerenders, the writable fields in the new set of props will be updated.
 * All props will be made observable and writable, but functions and components will be made with `observable.ref`, while other values with `observable.deep`.
 * 
 * To help the function determine which props should be deep observable and which ones should only observe ref changes,
 * strictly use the following naming conventions for props that could potentially contain any React components (class / functional / lazy / memoized):
 * - Capitalize first letter, such as `StartSlot`. (The regex to match this is `/^[A-Z]/`).
 * - Name it exactly `children`, and write JSX children as a function.
 * 
 * [Important]: For any non-component props that expects a function, 
 * you MUST provide a NoOp stub function on mount.
 * 
 * @param current: the props object.
 * @param annotations: Provide explicitly defined MobX observable annotations to override the auto-detected annotations by this utility function.
 * @see [Mobx Documentation: Observable State](https://mobx.js.org/observable-state.html)
 * 
 * Note that "useProps" is only necessary if you are using props in a local MobX store.
 * If props are only used in rendering function, you can just use the original props object unchanged and let React handle the re-rendering.
 * This helper is really created to make it easier to write code and more consistent,
 * and does not necessarily mean better performance.
 * Although in practice, no significant performance hit has been observed. (* to be systematically tested)
 * 
 * Rationale: By default, functions will be converted into non-writable, non-observable actions in MobX, 
 * as in MobX "logic" and "derivations" are by default considered not 'state', thus non-mutable and non-enumerable.
 * However, for the automatic props conversion, we want to keep functions in props as "things (state)" and not just "logic",
 * and keep them writable and observable, because they might well change during a rerender.
 * However, simply using default observable behaviour on components will recursively make them observable,
 * creating a new proxied object and causing some type checks of React component type to fail.
 * So component class / functional component / lazy / memoized components should never be converted into observables,
 * But the *reference* to them in our props state object should.
 * It is not possible to tell apart from code itself whether a function was intended as a functional component,
 * hence strict naming conventions is required so this helper can recognize them and keep them intact.
 * 
 */

export const useProps = <T extends AnyObject = AnyObject>(
  current: T,
  annotations: AuthorableAnnotationMap<T> = {},
  options?: ObservableWrapperOptions,
) => {

  const s = useLocalObservable(
    () => _wrap(current, annotations, {
      ...options,
      name: `useProps${options?.name ? `@${options?.name}` : ''}`,
    })
  );

  useEffect(() => {
    runInAction(() => {
      s.$$writableKeys.forEach(key => (s as T)[key] = current[key]);
    });
  });

  return s;

}


/**
 * A similar helper to MobX's useLocalObservable,
 * but with automatic annotations
 */
export const useStore = <T extends AnyObject = AnyObject>(
  initializer: () => T,
  annotations: AuthorableAnnotationMap<T> = {},
  options?: ObservableWrapperOptions,
) => useState(
  () => makeObservableStore(
    initializer(), 
    annotations, 
    {
      ...options,
      name: `useStore${options?.name ? `@${options?.name}` : ''}`
    }
  ),
)[0];


/**
 * 
 * Performs similar function to `useProps` with automatic annotations,
 * but returns a standalone observable object instead of a state in a component.
 * 
 * @param current: the props object.
 * @param annotations: Provide explicitly defined MobX observable annotations to override the auto-detected annotations by this utility function.
 * 
 */
export const makeObservableStore = <T extends AnyObject = AnyObject>(
  object: T,
  annotations: AuthorableAnnotationMap<T> = {},
  options?: ObservableWrapperOptions,
) => _wrap(object, annotations, options);


// ------------------------
// types & internal helpers
// ------------------------

export type AuthorableAnnotationValue = true | false | Annotation;
export type AuthorableAnnotationMap<T extends AnyObject = AnyObject> = Partial<Record<StringKeyOf<T>, AuthorableAnnotationValue>>;
export type ObservableWrapperOptions = {
  name?: string,
  proxy?: boolean,
  autoBind?: boolean,
}

/**
 * An observable store where functions are treated as states in the store and thus writable and observable.
 * Two $ signs are used, because this is one level more abstract than the usual controllers.
 * For model factory and controller abstractions, a single $ sign is used for meta-level fields and methods.
 */
export type ObservableStore<T extends AnyObject = AnyObject> = T & {
  $$writableKeys: StringKeyList<T>,
  $$debug?: () => void;
}

/**
 * This module's internal method to prepare a static object before making it observable with our custom annotations.
 */
const _wrap = <T extends AnyObject = AnyObject>(
  source: T,
  annotations: AuthorableAnnotationMap<T> = {},
  options?: ObservableWrapperOptions,
) => {

  const descriptors = Object.getOwnPropertyDescriptors(source);
  const _annotations = { ...annotations };

  Object.entries(descriptors).forEach(([key, desc]) => {
    if (key in _annotations) return;
    // must use get/set to filter out getter/setters first because they might refer to the constructed object,
    // and checking their values directly will result in error "cannot access x before initialisation".
    if (desc.get) return computed;
    if (desc.set) return false; // ignore lone setter
    if (_presumePropIsReactComponent(key) || isFunction(desc.value)) {
      _annotations[key as StringKeyOf<T>] = observable.ref;
      return;
    }
    // leave the rest to mobx to figure out
    _annotations[key as StringKeyOf<T>] = true;
  })

  const s = observable(source, _annotations as any, options) as ObservableStore<T>;

  extendObservable(s, {
    get $$writableKeys() {
      return Object.entries(source).filter(e => e[1]?.writable !== false).map(e => e[0]);
    }
  } as Partial<ObservableStore<T>>);

  if (isDevelopment) {
    extendObservable(s, {
      $$debug: () => {
        const keys = Object.keys(source) as StringKeyList<T>;
        console.log(`%c*** [${options?.name ?? 'observable'}] debug info  ***`, 'color: green');
        console.log(s);
        console.log('annotations:', _annotations);
        console.group('keys grouped by:');
        console.log(`%c    observable : ${keys.filter(k => isObservableProp(s, k)).join(' ')}`, 'font-family: monospace');
        console.log(`%cnon-observable : ${keys.filter(k => !isObservableProp(s, k)).join(' ')}`, 'font-family: monospace');
        console.log(`%c     computeds : ${keys.filter(k => isComputedProp(s, k)).join(' ')}`, 'font-family: monospace');
        console.log(`%c       actions : ${keys.filter(k => isAction(s[k])).join(' ')}`, 'font-family: monospace');
        console.log(`%c         flows : ${keys.filter(k => isFlow(s[k])).join(' ')}`, 'font-family: monospace');
        console.log(`%c      writable : ${s!.$$writableKeys.join(' ')}`, 'font-family: monospace');
        console.log(`%c      readonly : ${keys.filter(k => Object.getOwnPropertyDescriptor(s, k)?.writable === false).join(' ')}`, 'font-family: monospace');
        console.groupEnd();
      }
    })
  }

  return s;

}

const _presumePropIsReactComponent = (p: string) => p === 'children' || /^[A-Z]/.test(p);

export const isFlow = (fn: any) => fn?.isMobXFlow === true;
