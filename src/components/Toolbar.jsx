import React, { useRef, useState, useEffect } from 'react';
import { useDFDStore } from '../store';
import { Play, FolderOpen, Save, Image as ImageIcon, FilePlus, Menu, Download, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function Toolbar() {
  const { state, dispatch } = useDFDStore();
  const fileInputRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  const handleExportPNG = async () => {
    const el = document.getElementById('dfd-flow-export');
    const container = document.querySelector('.canvas-container');
    if (!el || !container) return;
    
    const oldTransform = container.style.transform;
    container.style.transform = 'none';
    
    try {
      const canvas = await html2canvas(el, { backgroundColor: '#f8f9fa', scale: 2 });
      const link = document.createElement('a');
      link.download = 'algoritmo.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      container.style.transform = oldTransform;
    }
  };

  const handleNew = () => {
     if(confirm('¿Seguro que deseas iniciar un nuevo proyecto? Perderás los cambios no guardados.')) {
        window.location.reload(); 
     }
  };

  const handleHardReset = async () => {
     if(confirm('¿Forzar actualización de DFDSoft? Esto borrará la memoria caché interna y descargará la última versión de internet.')) {
         try {
             if ('caches' in window) {
                 const keys = await caches.keys();
                 await Promise.all(keys.map(key => caches.delete(key)));
             }
             if ('serviceWorker' in navigator) {
                 const registrations = await navigator.serviceWorker.getRegistrations();
                 await Promise.all(registrations.map(r => r.unregister()));
             }
             window.location.reload(true);
         } catch(e) {
             console.error("Error limpiando caché:", e);
             window.location.reload(true);
         }
     }
  };

  const handleSaveDFD = () => {
     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
     const dlAnchorElem = document.createElement('a');
     dlAnchorElem.setAttribute("href",     dataStr     );
     dlAnchorElem.setAttribute("download", "proyecto.dfd");
     dlAnchorElem.click();
  };

  const handleOpenClick = () => {
     fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
     const file = e.target.files[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (event) => {
        try {
           const obj = JSON.parse(event.target.result);
           dispatch({ type: 'SET_STATE', payload: obj });
        } catch(err) {
           alert("El archivo no es válido");
        }
     };
     reader.readAsText(file);
  };

  const handlePlay = () => {
     dispatch({ type: 'SET_SIMULATION_ACTIVE', payload: true });
  };

  return (
    <header className="toolbar">
      <div className="toolbar-title" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
        <button title="Alternar Panel de Variables" onClick={() => dispatch({type: 'TOGGLE_SIDEBAR'})} style={{background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0}}>
           <Menu size={24} />
        </button>
        <img src={`${import.meta.env.BASE_URL}DFDSoft_Logo.png`} alt="DFDSoft Logo" style={{height: '28px', width: 'auto'}} />
        <span className="btn-text">DFDSoft</span>
      </div>
      <div className="toolbar-actions">
        {deferredPrompt && (
           <button title="Instalar Aplicación" onClick={handleInstallClick} style={{background: '#8e44ad'}}><Download size={18} /> <span className="btn-text">Instalar</span></button>
        )}
        <input type="file" accept=".dfd" ref={fileInputRef} style={{display:'none'}} onChange={handleFileChange} />
        <button title="Nuevo Proyecto" onClick={handleNew}><FilePlus size={18} /> <span className="btn-text">Nuevo</span></button>
        <button title="Abrir Proyecto (.dfd)" onClick={handleOpenClick}><FolderOpen size={18} /> <span className="btn-text">Abrir</span></button>
        <button title="Guardar Proyecto (.dfd)" onClick={handleSaveDFD}><Save size={18} /> <span className="btn-text">Guardar</span></button>
        <button title="Exportar como PNG" onClick={handleExportPNG}><ImageIcon size={18} /> <span className="btn-text">Guardar PNG</span></button>
        <button title="Ejecutar" onClick={handlePlay} style={{background: '#27ae60'}}><Play size={18} /> <span className="btn-text">Play</span></button>
        <button title="Fozar Actualización de App" onClick={handleHardReset} style={{background: '#e74c3c'}}><RefreshCw size={18} /> <span className="btn-text">Actualizar</span></button>
      </div>
    </header>
  );
}
