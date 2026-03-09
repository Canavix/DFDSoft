import React, { useState, useEffect } from 'react';
import { useDFDStore } from '../store';

export default function BlockConfig() {
  const { state, dispatch } = useDFDStore();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (state.editingBlockId) {
      setData({ ...state.blocks[state.editingBlockId] });
    }
  }, [state.editingBlockId, state.blocks]);

  if (!state.editingBlockId || !data) return null;

  const handleSave = () => {
    dispatch({ type: 'UPDATE_BLOCK', payload: data });
    dispatch({ type: 'SET_EDITING_BLOCK', payload: null });
  };

  const handleCancel = () => {
    dispatch({ type: 'SET_EDITING_BLOCK', payload: null });
  };

  // Variables for dropdowns
  const varOptions = state.variables.map(v => <option key={v.name} value={v.name}>{v.name}</option>);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: 8, minWidth: 350, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3>Configurar {data.type}</h3>
        
        {data.type === 'SALIDA' && (
           <div>
             <label style={{fontSize: 12, color: '#666'}}>Mensaje (use coma para concatenar, texto en 'comillas' simples):</label>
             <input type="text" style={{width: '100%', marginTop: 5}} value={data.message || ''} onChange={e => setData({...data, message: e.target.value})} placeholder="'Hola Mundo', varResultado" />
           </div>
        )}

        {data.type === 'ENTRADA' && (
           <div>
             <label style={{fontSize: 12, color: '#666'}}>Variable donde guardar:</label>
             <select style={{width: '100%', marginTop: 5, padding: 4}} value={data.variable || ''} onChange={e => setData({...data, variable: e.target.value})}>
                <option value="">-- Seleccionar --</option>
                {varOptions}
             </select>
           </div>
        )}

        {data.type === 'ACCION' && (
           <div style={{display:'flex', flexDirection:'column', gap: 5}}>
             <label style={{fontSize: 12, color: '#666'}}>Variable destino:</label>
             <select value={data.targetVar || ''} onChange={e => setData({...data, targetVar: e.target.value})}>
                <option value="">-- Seleccionar --</option>
                {varOptions}
             </select>
             <div style={{display:'flex', gap: 5, alignItems:'center', marginTop:10}}>
                <input type="text" placeholder="Var / Num" style={{width: 80}} value={data.op1 || ''} onChange={e => setData({...data, op1: e.target.value})} />
                <select value={data.operator || '+'} onChange={e => setData({...data, operator: e.target.value})}>
                   <option value="+">+</option>
                   <option value="-">-</option>
                   <option value="*">*</option>
                   <option value="/">/</option>
                </select>
                <input type="text" placeholder="Var / Num" style={{width: 80}} value={data.op2 || ''} onChange={e => setData({...data, op2: e.target.value})} />
             </div>
           </div>
        )}

        {(data.type === 'CONDICIONAL' || data.type === 'MQ') && (
           <div style={{display:'flex', gap: 5, alignItems:'center'}}>
              <input type="text" placeholder="Var / Num" style={{width: 80}} value={data.cond1 || ''} onChange={e => setData({...data, cond1: e.target.value})} />
              <select value={data.condOp || '=='} onChange={e => setData({...data, condOp: e.target.value})}>
                 <option value="==">==</option>
                 <option value="!=">!=</option>
                 <option value=">">&gt;</option>
                 <option value=">=">&gt;=</option>
                 <option value="<">&lt;</option>
                 <option value="<=">&lt;=</option>
              </select>
              <input type="text" placeholder="Var / Num" style={{width: 80}} value={data.cond2 || ''} onChange={e => setData({...data, cond2: e.target.value})} />
           </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button style={{padding: '6px 16px', background: '#ccc', border: 'none', borderRadius: 4, cursor: 'pointer'}} onClick={handleCancel}>Cancelar</button>
          <button style={{padding: '6px 16px', background: '#3b82f6', color:'white', border: 'none', borderRadius: 4, cursor: 'pointer'}} onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
