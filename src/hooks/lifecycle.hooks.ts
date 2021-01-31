import { useEffect } from "react";

const _asEffectCallback = (fn: Function) => () => fn();

export const useOnMount = (fn: Function) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(_asEffectCallback(fn), []);
}

export const useOnBeforeUnmount = (fn: Function) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => _asEffectCallback(fn), []);
}