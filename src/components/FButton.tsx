import { toJS } from 'mobx';
import { Observer } from 'mobx-react-lite';
import React from 'react';
import { useOnMount } from '../hooks/lifecycle.hooks';
import { renderRenderable } from '../utils/components.utils';
import { useProps } from '../utils/mobx.utils';

type FButtonProps = {
  title?: string,
  renderBeforeLabel?: Renderable,
  onClick?: (e: React.MouseEvent) => void,
  disabled?: boolean,
  debug?: boolean,
}

const FButton: React.FC<FButtonProps> = props => {
  const p = useProps(props);
  useOnMount(() => {
    if (p.debug) {
      console.log(p);
      console.log(toJS(p));
      const state = p.$getInternalState();
      console.group('auto-determined');
      console.log('deepObservableProps:', state?.autoDetermined.deepObservableProps);
      console.log('refObservableProps:', state?.autoDetermined.refObservableProps);
      console.log('annotations:', state?.autoDetermined.annotations);
      console.groupEnd();
      console.group('props');
      console.log('observable:', state?.observableProps);
      console.log('non-observable:', state?.nonObservableProps);
      console.log('actions & flows:', state?.actionProps);
      console.log('readonly:', state?.readonlyProps);
      console.groupEnd();
    }
  })
  return <Observer children={() => (
    <button className="FButton" onClick={p.onClick} data-disabled={p.disabled}>
      { p.renderBeforeLabel && renderRenderable(p.renderBeforeLabel) }
      { props.children }
    </button>
  )} />
}

export default FButton;