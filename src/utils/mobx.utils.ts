import { computed, isAction, isComputedProp, isObservableProp, makeObservable, observable, runInAction, toJS } from "mobx";
import { useLocalObservable } from "mobx-react-lite";
import type { Annotation } from "mobx/dist/internal";
import { useEffect, useState } from "react";
import { isDevelopment } from "./env.utils";
import { isFunction } from "./typeChecks.utils";

/**
 * 
 * A helper function to convert (typically) props object into an observable state object.
 * Everytime the component rerenders, the writable fields in the new set of props will be 
 * In summary, all props will be made observable, but functions and components will be made with `observable.ref`, while normal values with `observable.deep`.
 * 
 * To help the function determine which props should be deep observable and which ones should only observe ref changes,
 * strictly use the following naming convention for props that could potentially contain any React components (class / functional / lazy / memoized):
 * - Prefix with `render-`, or
 * - Suffix with `Renderer`,
 * - Name it exactly `children`, and write JSX children as a function.
 * 
 * [Important]: For any non-component props that expects a function, 
 * you MUST provide a NoOp stub function on mount.
 * 
 * @param current: the props object.
 * @param annotations: Provide explicitly defined MobX observable annotations to override the auto-detected annotations by this utility function.
 * @see [Mobx Documentation: Observable State](https://mobx.js.org/observable-state.html)
 * 
 * Rationale: By default, functions will be converted into non-writable, non-observable actions in MobX, 
 * which is not what we desire for an observable props object.
 * We want to keep functions in props as "things (state)" and not just "logic",
 * and keep them writable and observable.
 * However, simply using default observable behaviour on components will recursively make them observable,
 * creating a new proxied object and causing some type checks of React component type to fail.
 * So component class / functional component / lazy / memoized components should never be converted into observables,
 * But the *reference* to them in our props state object should.
 * It is not possible to tell apart from code itself whether a function was intended as a functional component,
 * hence strict naming conventions is required.
 * 
 */

export const useProps = <T extends AnyObject = AnyObject>(
  current: T,
  annotations: AuthorableAnnotationMap<T> = {},
  debug?: string,
) => {

  const s = useLocalObservable(
    () => _wrap(current, annotations, debug && `useProps@${debug}`),
    _mobxUtilInternalAnnotation
  );

  useEffect(() => {
    runInAction(() => {
      s.getObservableKeys().forEach(key => (s.value as T)[key] = current[key]);
    });
  });

  return s.value;

}

/**
 * A similar helper to MobX's useLocalObservable,
 * but with automatic annotations
 */
export const useStore = <T extends AnyObject = AnyObject>(
  initializer: () => T,
  annotations: AuthorableAnnotationMap<T> = {},
  debug?: string,
) => {

  return useState(
    () => makeObservableStore(
      initializer(), 
      annotations, 
      debug && `useStore@${debug}`
    ),
  )[0];

}

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
  debug?: string,
) => makeObservable(
  _wrap(object, annotations, debug),
  _mobxUtilInternalAnnotation,
).value;


// ------------------------
// types & internal helpers
// ------------------------

export type AuthorableAnnotationValue = true | false | Annotation;
export type AuthorableAnnotationMap<T extends AnyObject = AnyObject> = Partial<Record<StringKeyOf<T>, AuthorableAnnotationValue>>;

export type ObservableStoreInternalState<T extends AnyObject = AnyObject> = {
  value: ObservableStore<T>
  annotations: AuthorableAnnotationMap<T>,
  getObservableKeys: () => StringKeyList<T>,
  getNonObservableKeys: () => StringKeyList<T>,
  getReadonlyKeys: () => StringKeyList<T>,
  getComputedKeys: () => StringKeyList<T>,
  getActionKeys: () => StringKeyList<T>,
  getWritableKeys: () => StringKeyList<T>,
}
export type ObservableStore<T extends AnyObject = AnyObject> = T & {
  $getInternalState?: () => ObservableStoreInternalState<T>;
  $debug?: () => void;
}

/**
 * This module's internal method to prepare a static object before making it observable with our custom annotations.
 */
const _wrap = <T extends AnyObject = AnyObject>(
  object: T,
  annotations: AuthorableAnnotationMap<T> = {},
  debug?: string,
) => {

  const keys = Object.keys(object) as StringKeyList<T>;
  const descriptors = Object.getOwnPropertyDescriptors(object);

  Object.entries(descriptors).forEach(([key, desc]) => {
    if (key in annotations) return;
    // must use get/set to filter out getter/setters first because they might refer to the constructed object,
    // and checking their values directly will result in error "cannot access x before initialisation".
    if (desc.get) return computed
    if (desc.set) return false // ignore lone setter
    if (_presumeIsComponentProp(key) || isFunction(desc.value)) {
      annotations[key as StringKeyOf<T>] = observable.ref;
      return;
    }
    // leave the rest to mobx to figure out
    annotations[key as StringKeyOf<T>] = true;
  })

  const value = observable(object, annotations as any, { autoBind: true });

  const s: ObservableStoreInternalState<T> = { // hook internal state
    value: value as ObservableStore<T>, // exposed to component
    annotations,
    getObservableKeys: () => keys.filter(k => isObservableProp(value, k)),
    getNonObservableKeys: () => keys.filter(k => !isObservableProp(value, k)),
    getComputedKeys: () => keys.filter(k => isComputedProp(value, k)),
    getActionKeys: () => keys.filter(k => isAction(value[k])),
    getWritableKeys: () => keys.filter(k => Object.getOwnPropertyDescriptor(value, k)?.writable !== false),
    getReadonlyKeys: () => keys.filter(k => Object.getOwnPropertyDescriptor(value, k)?.writable === false),
  };

  if (isDevelopment) {
    /** exposes internal state to external environments, only available in dev builds */
    s.value.$getInternalState = () => s;
    s.value.$debug = () => {
      console.log(`%c*** [${debug}] debug info  ***`, 'color: green');
      console.log('internal state: ', s);
      console.log('internal state snapshot: ', toJS(s));
      console.log('auto-determined annotations:', s?.annotations);
      console.table({
        '- observable:': s?.getObservableKeys().join(' '),
        '- non-observable:': s?.getNonObservableKeys().join(' '),
        '- computeds:': s?.getComputedKeys().join(' '),
        '- actions & flows:': s?.getActionKeys().join(' '),
        '- writable:': s?.getWritableKeys().join(' '),
        '- readonly:': s?.getReadonlyKeys().join(' '),
      })
    }
  }

  // if (debug) console.log(debug, s);

  return s;

}

const _presumeIsComponentProp = (keyName: string) => (
  keyName === 'children' ||
  keyName.match(/^render[A-Z]/) ||
  keyName.match(/Renderer$/)
);

const _mobxUtilInternalAnnotation: AuthorableAnnotationMap = {
  value: observable,
  annotations: false,
  observableKeys: false,
  nonObservableKeys: false,
  readonlyKeys: false,
  actionKeys: false,
  getDescriptors: false,
};

