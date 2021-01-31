import { Observer } from 'mobx-react-lite';
import React, { CSSProperties } from 'react';
import { useOnMount } from '../hooks/lifecycle.hooks';
import { renderRenderable } from '../utils/components.utils';
import { useProps, useStore } from '../utils/mobx.utils';

type FButtonProps = {
  title?: string,
  BeforeLabel?: Renderable,
  onClick?: (e: React.MouseEvent) => void,
  disabled?: boolean,
  debug?: boolean,
}

const FButton: React.FC<FButtonProps> = props => {

  const p = useProps(props);

  const s = useStore(() => ({
    get color() {
      return p.disabled ? 'gray' : 'green';
    },
    get style(): CSSProperties {
      return {
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: s.color,
        color: 'white',
        border: 0,
        borderRadius: 3,
        padding: '1em',
      }
    }
  }));

  useOnMount(() => {
    if (p.debug) {
      p.$$debug?.();
      s.$$debug?.();
    }
  })

  return <Observer children={() => (
    <button
      className="FButton"
      onClick={p.onClick}
      data-disabled={p.disabled}
      style={s.style}
    >
      { p.BeforeLabel && renderRenderable(p.BeforeLabel) }
      { props.children }
    </button>
  )} />
}

export default FButton;