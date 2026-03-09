import React, { useRef } from 'react';
import { useDFDStore } from '../store';
import { Play, FolderOpen, Save, Image as ImageIcon, FilePlus } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function Toolbar() {
  const { state, dispatch } = useDFDStore();
  const fileInputRef = useRef(null);

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
        <img src={`${import.meta.env.BASE_URL}DFDSoft_Logo.png`} alt="DFDSoft Logo" style={{height: '28px', width: 'auto'}} />
        <span>DFDSoft</span>
      </div>
      <div className="toolbar-actions">
        <input type="file" accept=".dfd" ref={fileInputRef} style={{display:'none'}} onChange={handleFileChange} />
        <button title="Nuevo Proyecto" onClick={handleNew}><FilePlus size={18} /> Nuevo</button>
        <button title="Abrir Proyecto (.dfd)" onClick={handleOpenClick}><FolderOpen size={18} /> Abrir</button>
        <button title="Guardar Proyecto (.dfd)" onClick={handleSaveDFD}><Save size={18} /> Guardar</button>
        <button title="Exportar como PNG" onClick={handleExportPNG}><ImageIcon size={18} /> Guardar PNG</button>
        <button title="Ejecutar" onClick={handlePlay} style={{background: '#27ae60'}}><Play size={18} /> Play</button>
      </div>
    </header>
  );
}
