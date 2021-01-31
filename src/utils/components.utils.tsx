import React, { Suspense } from "react";
import { isFunction, isLazyComponent, isMemoizedComponent, isReactComponent } from "./typeChecks.utils";

export const renderRenderable = <P extends AnyObject = AnyObject>(R: Renderable<P>, props?: P, fallback?: Renderable) => {
  if (isMemoizedComponent(R)) return <R { ...props } />;
  if (isLazyComponent(R)) return <Suspense fallback={ renderRenderable(fallback) ?? 'Loading...' } children = {< R {...props } />} />
  if (isReactComponent(R)) return <R { ...props } />
  if (isFunction(R)) return R(props as any);
  return R;
}