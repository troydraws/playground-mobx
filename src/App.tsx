import './App.css';
import { action, flow, observable, reaction } from 'mobx';
import React from 'react';
import { Observer } from 'mobx-react-lite';

/**
 * 
 * Comparisons of... reassigning various type of stuff to an observable with MobX 6.0.4 vs 6.1.1
 * 
 */

const o = observable({
  value: 'old',
  normalFunction: () => {
    console.log('this is a normal function');
    return 'this is a normal function' as string;
  },
  actionFunction: action(() => {
    console.log('this is an action');
    return 'this is an action' as string;
  }),
  flowFunction: flow(function* () {
    console.log('this is a flow');
    return 'this is a flow' as string;
  }),
  flowResult: '',
})

/** when flow function is replaced, run it and save the result to flowResult */
reaction(
  () => o.flowFunction,
  flow(function * () {
    o.flowResult = yield o.flowFunction();
  }),
  { fireImmediately: true }
)

// replace action
setTimeout(action(() => {
  console.log('reassigning action')
  o.actionFunction = action(() => {
    console.log('this is a new action');
    return 'this is a new action';
  }) // <- works in both MobX 6.0.4 & 6.1.1
}), 1000);

// replace "authored to be" normal function
setTimeout(action(() => {
  console.log('reassigning normal function')
  o.normalFunction = () => {
    console.log('this is a new normal function')
    return 'this is a new normal function';
  } // <- works with Mobx 6.0.4 and triggers <Observer /> update, fails with Mobx 6.1.1
}), 2000);

// replace flow
setTimeout(action(() => {
  console.log('reassigning flow');
  o.flowFunction = flow(function* () {
    console.log('this is a new flow');
    return 'this is a new flow';
  }) // <- works with Mobx 6.0.4 and triggers reaction, fails with Mobx 6.1.1
}), 3000);

// replace primitive value
setTimeout(
  action(() => o.value = 'new'), 
  4000
);

function App() {
  return <Observer children={() => (
    <div className="App">
      <p>1. action: {o.actionFunction()}</p>
      <p>2. normal function: {o.normalFunction()}</p>
      <p>3. flow result (updated by reaction): {o.flowResult}</p>
      <p>4. primitive value: {o.value}</p>
    </div>
  )} />
}

export default App;
