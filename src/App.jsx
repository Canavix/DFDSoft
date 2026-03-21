import React from 'react';
import { DFDProvider } from './store';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import BlockConfig from './components/BlockConfig';
import Simulator from './components/Simulator';
import SettingsModal from './components/SettingsModal';

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
        <SettingsModal />
        <footer className="footer">
          &copy; 2026 Cristian Camilo Cañaveral Avilés. Distribuido bajo Licencia MIT.
        </footer>
      </div>
    </DFDProvider>
  );
}

export default App;
