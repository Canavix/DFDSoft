import React, { useState } from 'react';
import { useDFDStore } from '../store';
import { Plus, Minus } from 'lucide-react';

export default function Block({ id, branchParentId, branchName }) {
  const { state, dispatch } = useDFDStore();
  const [showOptions, setShowOptions] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);

  const data = state.blocks[id];
  if (!data) return null;

  const blockStyles = {
    INICIO: { borderRadius: '50%', background: '#fff' },
    FIN: { borderRadius: '50%', background: '#fff' },
    SALIDA: { background: 'var(--color-salida)' },
    ENTRADA: { background: 'var(--color-entrada)', transform: 'skew(-15deg)' },
    ACCION: { background: 'var(--color-accion)' },
    CONDICIONAL: { background: 'var(--color-condicional)', transform: 'rotate(45deg)' },
    MQ: { background: 'var(--color-mq)' },
    FIN_MQ: { background: 'var(--color-mq)', opacity: 0.8 },
  };

  const isTerminal = data.type === 'INICIO' || data.type === 'FIN';
  const width = data.type === 'CONDICIONAL' ? 80 : 120;
  const height = data.type === 'CONDICIONAL' ? 80 : 50;

  const style = {
    ...blockStyles[data.type],
    border: '2px solid black',
    width, height,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', cursor: 'pointer',
    position: 'relative', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  };

  const textTransform = data.type === 'ENTRADA' ? 'skew(15deg)' : data.type === 'CONDICIONAL' ? 'rotate(-45deg)' : 'none';

  const handleAdd = (type, branch = 'next') => {
     dispatch({ type: 'ADD_BLOCK', payload: { type, targetId: id, branch } });
     setShowAddMenu(false);
     setShowBranchMenu(false);
     setShowOptions(false);
  };

  const blockElement = (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '15px 0', zIndex: showOptions || showAddMenu || showBranchMenu ? 999 : 2 }}>
      <div 
        style={style} 
        onClick={() => { if(data.type !== 'FIN') setShowOptions(!showOptions) }}
        onDoubleClick={() => {
           if (!['INICIO', 'FIN', 'FIN_MQ'].includes(data.type)) {
              dispatch({ type: 'SET_EDITING_BLOCK', payload: data.id });
           }
        }}
        title="Doble clic para editar"
      >
        <div style={{ transform: textTransform, fontWeight: 'bold', fontSize: 14 }}>
           {data.type}
           {data.message && <div style={{fontSize: 10, fontWeight: 'normal'}}>{data.message.substring(0, 10)}...</div>}
           {data.variable && <div style={{fontSize: 10, fontWeight: 'normal'}}>{data.variable}</div>}
        </div>
      </div>

      {showOptions && data.type !== 'FIN' && (
        <div style={{ position: 'absolute', right: -40, top: 0, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 10 }}>
          <button style={{ borderRadius:'50%', width:24, height:24, background:'#3b82f6', color:'white', border:'none', cursor:'pointer' }} onClick={(e) => { e.stopPropagation(); setShowAddMenu(true); }}><Plus size={14}/></button>
          {data.type !== 'INICIO' && (
            <button style={{ borderRadius:'50%', width:24, height:24, background:'#ef4444', color:'white', border:'none', cursor:'pointer' }} onClick={() => dispatch({type: 'REMOVE_BLOCK', payload: data.id})}><Minus size={14}/></button>
          )}
        </div>
      )}

      {showAddMenu && (
         <div style={{ position: 'absolute', right: -160, top: 0, background: 'white', border: '1px solid #ccc', padding: 5, borderRadius: 4, display: 'flex', flexDirection: 'column', zIndex: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
           {data.type === 'CONDICIONAL' ? (
              <>
                 <span style={{fontSize:12, fontWeight:'bold', marginBottom:5, textAlign:'center'}}>¿Dónde insertar?</span>
                 <button onClick={() => setShowBranchMenu('yesBranch')} style={{ padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #eee' }}>Rama SI</button>
                 <button onClick={() => setShowBranchMenu('noBranch')} style={{ padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #eee' }}>Rama NO</button>
                 <button onClick={() => setShowBranchMenu('next')} style={{ padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #eee' }}>Convergencia (Abajo)</button>
              </>
           ) : (
              ['SALIDA', 'ENTRADA', 'ACCION', 'CONDICIONAL', 'MQ'].map(type => (
                <button key={type} onClick={() => handleAdd(type, data.type === 'MQ' ? 'bodyBranch' : 'next')} style={{ padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                  {type}
                </button>
              ))
           )}
           <div style={{ borderTop: '1px solid #ccc', margin: '4px 0' }}></div>
           <button style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'red' }} onClick={() => setShowAddMenu(false)}>Cancelar</button>
         </div>
      )}
      
      {showBranchMenu && (
         <div style={{ position: 'absolute', right: -300, top: 0, background: 'white', border: '1px solid #ccc', padding: 5, borderRadius: 4, display: 'flex', flexDirection: 'column', zIndex: 20 }}>
            <span style={{fontSize:12, fontWeight:'bold', marginBottom:5}}>Tipo de Bloque</span>
            {['SALIDA', 'ENTRADA', 'ACCION', 'CONDICIONAL', 'MQ'].map(type => (
              <button key={type} onClick={() => handleAdd(type, typeof showBranchMenu === 'string' ? showBranchMenu : 'next')} style={{ padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                {type}
              </button>
            ))}
            <button style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'red' }} onClick={() => {setShowBranchMenu(false); setShowAddMenu(false)}}>Cancelar</button>
         </div>
      )}
    </div>
  );

  return blockElement;
}
