import React from "react";

export default class CButton extends React.Component<{}> {
  render() {
    return <button>{this.props.children}</button>
  }
}