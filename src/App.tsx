import { action, flow } from 'mobx';
import { Observer } from 'mobx-react-lite';
import React from 'react';
import './App.css';
import FButton from './components/FButton';
import IconGClef from './components/IconGClef';
import IconHand from './components/IconHand';
import { NoOp } from './utils/functions.utils';
import { useStore } from './utils/mobx.utils';

// const o = observable({
//   text: 'string',
//   onClick: () => { console.log('this') },
//   component: FButton,
// }, { text: })

function App() {
  const s = useStore(() => ({
    buttonTitle: 'button title',
    changeButtonTitle: flow(function * () {
      s.buttonTitle = s.buttonTitle + ' new';
    }),
    buttonDisabled: false,
    toggleDisableButton: action(() => {
      s.buttonDisabled = !s.buttonDisabled
    }),
    simpleLog: () => {
      console.log('this');
    }
  }))
  return <Observer children={() => (
    <div className="App">
      <FButton
        title="Button Title"
        onClick={s.buttonDisabled ? NoOp : s.changeButtonTitle}
        BeforeLabel={s.buttonDisabled ? IconHand : IconGClef}
        disabled={s.buttonDisabled}
        debug
      >{s.buttonTitle}</FButton>
      <br />
      <br />
      <button onClick={s.toggleDisableButton}>
        Toggle Disable
      </button>
    </div>
  )} />
}

export default App;
