import React from 'react';
import { DFDProvider } from './store';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import BlockConfig from './components/BlockConfig';
import Simulator from './components/Simulator';

function App() {
  return (
    <DFDProvider>
      <div className="layout">
        <Toolbar />
        <div className="main-content">
          <Sidebar />
          <Workspace />
          <BlockConfig />
          <Simulator />
        </div>
        <footer className="footer">
          Desarrollado por Cristian Camilo Cañaveral Avilés
        </footer>
      </div>
    </DFDProvider>
  );
}

export default App;
