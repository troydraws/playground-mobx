import { isAction, isObservableProp, observable, runInAction } from "mobx";
import { useLocalObservable } from "mobx-react-lite";
import type { Annotation } from "mobx/dist/internal";
import { useEffect } from "react";
import { isDevelopment } from "./env.utils";

export type AuthorableAnnotationValue = true | false | Annotation;
export type AuthorableAnnotationMap<T extends AnyObject = AnyObject> = Partial<Record<StringKeyOf<T>, AuthorableAnnotationValue>>;

/**
 * 
 * *** Experimental ***
 * 
 * A helper function to convert (typically) props object into an observable state object.
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
) => {

  const s = useLocalObservable(() => {

    const keys = Object.keys(current) as StringKeyOf<T>[]

    const deepObservableProps = [...keys];
    const refObservableProps = keys.filter(k => typeof k === 'function' || _presumeIsComponentProp(k))
    refObservableProps.forEach(k => {
      if (!(k in annotations)) annotations[k] = observable.ref;
      if (annotations[k]) deepObservableProps.splice(deepObservableProps.indexOf(k), 1);
    })
    deepObservableProps.forEach(k => {
      if (!(k in annotations)) annotations[k] = observable;
    })

    const value = observable({
      ...current,
      /** exposes internal state to external environments, only available in dev builds */
      $getInternalState: () => isDevelopment ? s : undefined,
    }, annotations as any)

    return { // hook internal state
      value, // exposed to component
      autoDetermined: {
        deepObservableProps,
        refObservableProps,
        annotations,
      },
      observableProps: keys.filter(k => isObservableProp(value, k)) as StringKeyOf<T>[],
      nonObservableProps: keys.filter(k => !isObservableProp(value, k)) as StringKeyOf<T>[],
      actionProps: keys.filter(k => isAction(value[k])) as StringKeyOf<T>[],
      readonlyProps: keys.filter(k => Object.getOwnPropertyDescriptor(value, k)?.writable === false) as StringKeyOf<T>[],
      getDescriptors: () => Object.getOwnPropertyDescriptors(value),
    }
  }, _propsInternalAnnotation)

  useEffect(() => {
    runInAction(() => {
      s.observableProps.forEach(key => (s.value as T)[key] = current[key]);
    });
  })

  return s.value

}

const _presumeIsComponentProp = (keyName: string) => (
  keyName === 'children' ||
  keyName.match(/^render[A-Z]/) ||
  keyName.match(/Renderer$/)
);

const _propsInternalAnnotation: AuthorableAnnotationMap = {
  value: observable,
  autoDetermined: false,
  observableProps: false,
  readonlyProps: false,
  actionProps: false,
  nonObservableProps: false
};

/**
 * An alias MobX's useLocalObservable hook
 */
export const useState = useLocalObservable;
