import * as React from 'react';
import './App.css';
import Canvas from './components/Canvas';
import {IMenuButton, MenuBar} from './components/MenuBar';

class App extends React.Component {

  private buttons: IMenuButton[];

  public constructor(props: any) {
    super(props);

    // Setup our button
    this.buttons = [];
    this.buttons[0] = {text: "Click Me!", click: this.onClickedButton};
    this.buttons[1] = {text: "Click Me!", click: this.onClickedButton};

  }

  public onClickedButton() {
    window.alert('Clicked button');
  }

  public render() {
    return (
      <div className="App">
        <MenuBar buttons={this.buttons}/>
        <Canvas backgroundColor={"#c0c0c0"} hoverColor={"#d3d3d3"} width={128} height={128}/>
      </div>
    );
  }
}

export default App;
