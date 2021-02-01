import { extendObservable, observable } from "mobx";
import { NoOp } from "./functions.utils";
import { AuthorableAnnotationMap } from "./mobx.utils";

export type Controller<
  Name extends string = string,
  BaseType extends AnyObject = AnyObject, 
  ChildrenNames extends string = string,
  InitOptions extends AnyObject = AnyObject,
> = BaseType & {
  $name: Name,
  $root: Controller<Name, AnyObject, Name>,
  $init: (options?: InitOptions) => Promise<Controller<Name, BaseType>>,
  $reset: () => Promise<Controller<Name, BaseType>>,
  $children: Record<ChildrenNames, Controller>,
  $isRoot: boolean,
}

/**
 * 
 * Constructs an observable controller.
 * A controller is a domain-specific controller, usually provided by a top-level React context.
 * Controllers under the same root controller can find each other by traversing up and down the tree.
 * 
 * A controller must take care of initiating its children stores by calling their init functions in the correct order.
 * This factory-of-factory does not attempt to provide an automatic solution, 
 * as there usually is a certain order that child controllers must be initiated due to dependencies between them.
 * This is the same for the reset function. Each controller is responsible for calling their children's reset functions.
 * 
 * By convention, the names of the controllers should be in allcaps, such as "AUTH" or "NAVIGATOR".
 * 
 * The name "Controller" was chosen because "Controller" is reserved for more general controllers.
 * 
 * $ sign denotes meta-level fields and methods that is not considered as the functionalities that the controller itself provides.
 * 
 */
export const makeObservableControllerFactory = <
  Name extends string = string,
  BaseType extends AnyObject = AnyObject,
  ChildrenNames extends string = string,
  InitOptions extends AnyObject = AnyObject,
  ConstructorOptions extends AnyObject = AnyObject,
>(
  factoryOptions: {
    name: Name,
    baseFactory: (constructorOptions?: ConstructorOptions) => BaseType,
    initFn?: (options?: InitOptions) => Promise<Controller<Name, BaseType, ChildrenNames, InitOptions>>,
    resetFn?: () => Promise<Controller<Name, BaseType, ChildrenNames, InitOptions>>,
    rootController?: Controller<Name, AnyObject, Name>,
    children?: Record<ChildrenNames, Controller>,
    annotations?: AuthorableAnnotationMap<BaseType>,
    defaultConstructorOptions?: ConstructorOptions,
  },
) => {
  
  return (
    constructorOptions?: ConstructorOptions,
  ) => {

    const { name, baseFactory, initFn, resetFn, rootController, annotations, children, defaultConstructorOptions } = factoryOptions;

    const c = observable(
      baseFactory({
        ...defaultConstructorOptions,
        ...constructorOptions,
      } as ConstructorOptions),
      annotations as any,
      { name }
    ) as Controller<Name, BaseType, ChildrenNames>;

    extendObservable(c, {
      get $name() { return name },
      get $init() { return initFn ?? NoOp },
      get $reset() { return resetFn },
      get $root() { return rootController ?? c },
      get $children() { return children ?? {} },
      get $isRoot() { return !rootController },
    } as Partial<Controller<Name, BaseType, ChildrenNames>>);

    return c;

  }

}