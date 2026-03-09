import React, { useState } from 'react';
import { useDFDStore } from '../store';
import { Plus, Trash2, Edit2, HelpCircle } from 'lucide-react';

export default function Sidebar() {
  const { state, dispatch } = useDFDStore();
  const [showModal, setShowModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editingVar, setEditingVar] = useState(null);
  const [varName, setVarName] = useState('');
  const [varValue, setVarValue] = useState('0');

  const handleSave = () => {
    if (!varName) return;
    const numericValue = Number(varValue) || 0;
    if (editingVar) {
      dispatch({ 
        type: 'EDIT_VARIABLE', 
        payload: { oldName: editingVar, newVar: { name: varName, value: numericValue } } 
      });
    } else {
      dispatch({ 
        type: 'ADD_VARIABLE', 
        payload: { name: varName, value: numericValue } 
      });
    }
    setShowModal(false);
    setVarName('');
    setVarValue('0');
    setEditingVar(null);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Variables</h3>
        <button className="add-variable-btn" onClick={() => setShowModal(true)}><Plus size={16} /></button>
      </div>
      <div className="variable-list">
        {state.variables.length === 0 ? (
          <p className="no-variables">No hay variables definidas.</p>
        ) : (
          state.variables.map(v => (
            <div key={v.name} className="variable-item" style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #efefef'}}>
              <span>{v.name} = {v.value}</span>
              <div style={{display:'flex', gap: '0.5rem'}}>
                 <Edit2 size={14} style={{cursor: 'pointer'}} onClick={() => {
                   setEditingVar(v.name);
                   setVarName(v.name);
                   setVarValue(String(v.value));
                   setShowModal(true);
                 }}/>
                 <Trash2 size={14} style={{cursor: 'pointer', color: 'red'}} onClick={() => dispatch({type: 'DELETE_VARIABLE', payload: v.name})}/>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderTop: '1px solid #ddd' }}>
        <button 
          onClick={() => setShowHelp(true)} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
        >
          <HelpCircle size={18} /> Ayuda y Uso
        </button>
        <img src="/ITS.png" alt="ITS Logo" style={{ maxWidth: '100px', objectFit: 'contain' }} />
      </div>

      {showModal && (
        <div className="modal-overlay" style={{position:'absolute', top: 0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems:'center', justifyContent: 'center'}}>
          <div className="modal-content" style={{background:'white', padding: '2rem', borderRadius: '8px', minWidth: '300px'}}>
             <h3>{editingVar ? 'Editar Variable' : 'Nueva Variable'}</h3>
             <div style={{display:'flex', flexDirection:'column', gap: '1rem', marginTop: '1rem'}}>
               <input type="text" placeholder="Nombre (ej: valorTemperatura)" value={varName} onChange={e => setVarName(e.target.value)} />
               <input type="number" placeholder="Valor inicial (0 por defecto)" value={varValue} onChange={e => setVarValue(e.target.value)} />
               <div style={{display:'flex', justifyContent: 'flex-end', gap: '1rem'}}>
                  <button onClick={() => setShowModal(false)}>Cancelar</button>
                  <button onClick={handleSave}>Guardar</button>
               </div>
             </div>
          </div>
        </div>
      )}
      {showHelp && (
        <div className="modal-overlay" style={{position:'absolute', top: 0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems:'center', justifyContent: 'center'}}>
          <div className="modal-content" style={{background:'white', padding: '2rem', borderRadius: '8px', minWidth: '400px', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto'}}>
             <h3>Guía de Uso Rápido - DFDSoft</h3>
             <div style={{marginTop: '1rem', lineHeight: '1.6'}}>
                <h4>1. El Espacio de Trabajo</h4>
                <p>El lienzo funciona como un mapa infinito. Arrastra con clic izquierdo para moverte y usa CTRL + Rueda del Ratón para acercar o alejar (Zoom). Usa el botón "Centrar" abajo a la izquierda para volver al inicio.</p>
                
                <h4>2. Variables</h4>
                <p>Crea las variables que vas a utilizar (ej. `x`, `contador`, `resultado`) en el panel izquierdo antes de usarlas en el algoritmo. Puedes asignarles un valor inicial.</p>
                
                <h4>3. Insertar Bloques</h4>
                <p>Haz clic en el símbolo <b>+</b> al lado de un bloque para insertar un nuevo paso inmediatamente debajo de él (o en la rama deseada si es un condicional).</p>
                
                <h4>4. Editar Bloques</h4>
                <p>Haz <b>doble clic</b> sobre un bloque abstracto (Entrada, Salida, Condicional, etc.) para abrir sus propiedades y enlazar variables, operaciones o mensajes.</p>
                
                <h4>5. Ejecutar Simulación</h4>
                <p>Haz clic en <b>Play</b> arriba a la derecha. El algoritmo comenzará a resaltar la ruta lógica ejecutada, solicitándote variables o mostrando resultados según corresponda.</p>
                
                <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #eee' }} />
                <p style={{ fontStyle: 'italic', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                  Para soporte, integraciones o comentarios sobre el software, puede contactar al desarrollador en:<br />
                  <a href="mailto:camilo.canaveral@itspereira.edu.co" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>camilo.canaveral@itspereira.edu.co</a>
                </p>
             </div>
             <div style={{display:'flex', justifyContent: 'flex-end', marginTop: '1.5rem'}}>
                <button onClick={() => setShowHelp(false)} style={{padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Entendido</button>
             </div>
          </div>
        </div>
      )}
    </aside>
  );
}
