import React, { useState, useEffect } from 'react';
import { useDFDStore } from '../store';
import { Download, RefreshCw, X } from 'lucide-react';

export default function SettingsModal() {
  const { state, dispatch } = useDFDStore();
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
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

  const currentSensitivity = state.panSensitivity || 1;

  if (!state.isSettingsOpen) return null;

  return (
    <div className="modal-overlay" style={{position:'absolute', top: 0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems:'center', justifyContent: 'center'}}>
      <div className="modal-content" style={{background:'white', padding: '2rem', borderRadius: '8px', minWidth: '300px', maxWidth: '400px'}}>
         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
           <h3 style={{margin: 0}}>Configuración</h3>
           <button onClick={() => dispatch({type: 'SET_SETTINGS_OPEN', payload: false})} style={{background: 'transparent', border: 'none', cursor: 'pointer', color: '#666'}}>
             <X size={20} />
           </button>
         </div>
         
         <div style={{display:'flex', flexDirection:'column', gap: '1.5rem'}}>
           
           <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div>
                 <label style={{display: 'block', fontWeight: 'bold', fontSize: '1rem'}}>
                   Modo Turbo
                 </label>
                 <small style={{color: '#666', fontSize: '0.85rem'}}>Ejecución rápida e instantánea de la simulación.</small>
              </div>
              <input 
                 type="checkbox" 
                 checked={state.turboMode !== false}
                 onChange={() => dispatch({ type: 'TOGGLE_TURBO_MODE' })}
                 style={{width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3b82f6'}}
              />
           </div>

           <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '-0.5rem 0'}} />

           <div>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem'}}>
                Sensibilidad de Desplazamiento: {currentSensitivity}x
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="20.0" 
                step="0.1" 
                value={currentSensitivity}
                onChange={(e) => dispatch({ type: 'SET_PAN_SENSITIVITY', payload: parseFloat(e.target.value) })}
                style={{width: '100%'}}
              />
              <small style={{display: 'block', marginTop: '0.2rem', color: '#666', fontSize: '0.8rem'}}>
                Aumenta este valor si notas el desplazamiento lento en pantallas de alta resolución.
              </small>
           </div>

           <hr style={{border: 'none', borderTop: '1px solid #eee', margin: 0}} />

           {deferredPrompt && (
             <button 
                onClick={handleInstallClick} 
                style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#8e44ad', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: 'bold'}}
             >
                <Download size={18} /> Instalar Aplicación
             </button>
           )}

           <button 
              onClick={handleHardReset} 
              style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: 'bold'}}
           >
              <RefreshCw size={18} /> Forzar Actualización
           </button>
           
         </div>
      </div>
    </div>
  );
}
