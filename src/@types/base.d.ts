type AnyObject = Record<string, any>;
type StringKeyOf<T extends AnyObject> = Exclude<string & keyof T, 'toString'>;
type StringKeyList<T extends AnyObject> = StringKeyOf<T>[];

type Renderable<P extends AnyObject = AnyObject> = string | boolean | number | null | undefined | React.ReactElement<P> | React.FC<P> | ((...args: any[]) => React.ReactElement);
type RenderableLazy<P extends AnyObject = AnyObject> = React.LazyExoticComponent<React.FC<P>>;

