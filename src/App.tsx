import * as React from 'react';
import './App.css';
import Canvas from './components/Canvas';

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <Canvas backgroundColor={"#c0c0c0"} hoverColor={"#d3d3d3"} width={128} height={128}/>
      </div>
    );
  }
}

export default App;
