import './App.css';
import { action, flow, isAction, isObservableProp, observable, reaction } from 'mobx';
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
    return 'this is a normal function' as string;
  },
  actionFunction: action(() => {
    return 'this is an action' as string;
  }),
  flowFunction: flow(function* () {
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
  console.log('#actionFunction');
  console.log(`isAction: ${isAction(o.actionFunction)}`)
  console.log(`isObservableProp: ${isObservableProp(o, 'actionFunction')}`)
  console.log('* reassigning action *')
  o.actionFunction = action(() => {
    return 'this is a new action';
  }) // <- works in both MobX 6.0.4 & 6.1.1
  console.log(`isAction: ${isAction(o.actionFunction)}`)
  console.log(`isObservableProp: ${isObservableProp(o, 'actionFunction')}`)
  console.log('––––––');
}), 1000);

// replace authored-to-be normal function
setTimeout(action(() => {
  console.log('#normalFunction');
  console.log(`isAction: ${isAction(o.normalFunction)}`)
  console.log(`isObservableProp: ${isObservableProp(o, 'normalFunction')}`)
  console.log('* reassigning normal function *')
  o.normalFunction = () => {
    return 'this is a new normal function';
  } // <- works with Mobx 6.0.4 and triggers <Observer /> update, fails with Mobx 6.1.1
  console.log(`isAction: ${isAction(o.normalFunction)}`)
  console.log(`isObservableProp: ${isObservableProp(o, 'normalFunction')}`)
  console.log('––––––');
}), 2000);

// replace flow
setTimeout(action(() => {
  console.log('#flowFunction');
  console.log(`isAction: ${isAction(o.flowFunction)}`)
  console.log(`isObservableProp: ${isObservableProp(o, 'flowFunction')}`)
  o.flowFunction = flow(function* () {
    return 'this is a new flow';
  }) // <- works with Mobx 6.0.4 and triggers reaction, fails with Mobx 6.1.1
  console.log('* reassigning flow *');
  console.log(`isAction: ${isAction(o.flowFunction)}`)
  console.log(`isObservableProp: ${isObservableProp(o, 'flowFunction')}`)
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
