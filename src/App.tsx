import { action } from 'mobx';
import { Observer, useLocalObservable } from 'mobx-react-lite';
import React from 'react';
import './App.css';
import FButton from './components/FButton';
import IconGClef from './components/IconGClef';
import IconHand from './components/IconHand';
import { NoOp } from './utils/functions.utils';

// const o = observable({
//   text: 'string',
//   onClick: () => { console.log('this') },
//   component: FButton,
// }, { text: })

function App() {
  const s = useLocalObservable(() => ({
    buttonTitle: 'button title',
    changeButtonTitle: action(() => {
      s.buttonTitle = s.buttonTitle + ' new';
    }),
    buttonDisabled: false,
    toggleDisableButton: action(() => {
      s.buttonDisabled = !s.buttonDisabled
    })
  }))
  return <Observer children={() => (
    <div className="App">
      <FButton
        title="Button Title"
        onClick={s.buttonDisabled ? NoOp : s.changeButtonTitle}
        renderBeforeLabel={s.buttonDisabled ? IconHand : IconGClef}
        disabled={s.buttonDisabled}
        debug
      ><p>{s.buttonTitle}</p></FButton>
      <button onClick={s.toggleDisableButton}>
        Toggle Disable
      </button>
    </div>
  )} />
}

export default App;
