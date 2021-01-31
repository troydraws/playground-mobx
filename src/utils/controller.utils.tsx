import { AuthorableAnnotationMap } from "./mobx.utils";

export type Controller<T extends AnyObject> = {
  name: string,
  init: () => Promise<T>,
  reset: () => Promise<T>,

}
export const makeControllerFactory = <T extends AnyObject>(
  initializer: () => T,
  annotations: AuthorableAnnotationMap,
) => {
  
}