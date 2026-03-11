import React, { useState, useEffect } from 'react';
import { useDFDStore } from '../store';

export default function Simulator() {
  const { state, dispatch } = useDFDStore();
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [localVars, setLocalVars] = useState({});
  const [returnStack, setReturnStack] = useState([]);
  const [modalText, setModalText] = useState(null);
  const [modalInput, setModalInput] = useState(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (state.simulationActive && !currentNodeId) {
       const initialVars = {};
       state.variables.forEach(v => initialVars[v.name] = v.value);
       setLocalVars(initialVars);
       setReturnStack([]);
       setCurrentNodeId(state.head);
    }
  }, [state.simulationActive, currentNodeId, state.variables, state.head]);

  const handleStop = () => {
     dispatch({ type: 'SET_SIMULATION_ACTIVE', payload: false });
     setCurrentNodeId(null);
     setReturnStack([]);
     setModalText(null);
     setModalInput(null);
  };

  const evaluateValue = (valStr) => {
    if (valStr === undefined || valStr === null || valStr.trim() === '') return 0;
    const num = Number(valStr);
    if (!isNaN(num)) return num;
    return localVars[valStr] !== undefined ? localVars[valStr] : 0;
  };

  const executeNode = () => {
    if (!currentNodeId) return;
    const node = state.blocks[currentNodeId];
    if (!node) return handleStop();

    if (node.type === 'INICIO') {
        moveToNext(node.next);
    } 
    else if (node.type === 'FIN') {
        alert("Simulación terminada con éxito.");
        handleStop();
    }
    else if (node.type === 'SALIDA') {
        let finalMessage = node.message || '';
        const parts = finalMessage.split(',').map(s => s.trim());
        let out = '';
        parts.forEach(p => {
           if (p.startsWith("'") && p.endsWith("'")) {
               out += p.substring(1, p.length - 1) + ' ';
           } else if (p.startsWith('"') && p.endsWith('"')) {
               out += p.substring(1, p.length - 1) + ' ';
           } else {
               out += (localVars[p] !== undefined ? localVars[p] : p) + ' ';
           }
        });
        setModalText(out);
    }
    else if (node.type === 'ENTRADA') {
        setModalInput(node.variable);
        setInputValue('');
    }
    else if (node.type === 'ACCION') {
        const v1 = Number(evaluateValue(node.op1)) || 0;
        const v2 = Number(evaluateValue(node.op2)) || 0;
        let result = 0;
        const op = node.operator || '+';
        
        if (op === '+') result = v1 + v2;
        if (op === '-') result = v1 - v2;
        if (op === '*') result = v1 * v2;
        if (op === '/') result = v1 / v2;
        
        if (node.targetVar) {
            setLocalVars(prev => ({...prev, [node.targetVar]: result}));
        }
        moveToNext(node.next);
    }
    else if (node.type === 'CONDICIONAL') {
        const c1 = evaluateValue(node.cond1);
        const c2 = evaluateValue(node.cond2);
        let result = false;
        const cop = node.condOp || '==';
        
        if (cop === '==') result = c1 == c2;
        if (cop === '!=') result = c1 != c2;
        if (cop === '>')  result = c1 > c2;
        if (cop === '>=') result = c1 >= c2;
        if (cop === '<')  result = c1 < c2;
        if (cop === '<=') result = c1 <= c2;

        if (result) {
            if (node.yesBranch) {
                setReturnStack(prev => [...prev, node.next]);
                setCurrentNodeId(node.yesBranch);
            } else {
                setCurrentNodeId(node.next);
            }
        } else {
            if (node.noBranch) {
                setReturnStack(prev => [...prev, node.next]);
                setCurrentNodeId(node.noBranch);
            } else {
                setCurrentNodeId(node.next);
            }
        }
    }
    else if (node.type === 'MQ') {
        const c1 = evaluateValue(node.cond1);
        const c2 = evaluateValue(node.cond2);
        let result = false;
        const cop = node.condOp || '==';

        if (cop === '==') result = c1 == c2;
        if (cop === '!=') result = c1 != c2;
        if (cop === '>')  result = c1 > c2;
        if (cop === '>=') result = c1 >= c2;
        if (cop === '<')  result = c1 < c2;
        if (cop === '<=') result = c1 <= c2;

        if (result) {
            if (node.bodyBranch) {
                setReturnStack(prev => [...prev, node.next]); // node.next is FIN_MQ
                setCurrentNodeId(node.bodyBranch);
            } else {
                setCurrentNodeId(node.next);
            }
        } else {
            const endMqNode = state.blocks[node.next];
            setCurrentNodeId(endMqNode ? endMqNode.next : null);
        }
    }
    else if (node.type === 'FIN_MQ') {
        setCurrentNodeId(node.parentId);
    }
    else {
        moveToNext(node.next);
    }
  };

  const moveToNext = (nextId) => {
      if (nextId) {
          setCurrentNodeId(nextId);
      } else {
          // If no next pointer, pop from the return stack for convergence
          if (returnStack.length > 0) {
              const newStack = [...returnStack];
              const convergenceId = newStack.pop();
              setReturnStack(newStack);
              setCurrentNodeId(convergenceId);
          } else {
              handleStop();
          }
      }
  };

  useEffect(() => {
     if (state.simulationActive && currentNodeId && modalText === null && modalInput === null) {
        const timer = setTimeout(() => {
           executeNode();
        }, 300); // 300ms delay to visually follow the flow if needed, and to avoid max call stack
        return () => clearTimeout(timer);
     }
  }, [state.simulationActive, currentNodeId, modalText, modalInput, localVars, state.blocks]);

  if (!state.simulationActive) return null;

  const handleNextMessage = () => {
     setModalText(null);
     const node = state.blocks[currentNodeId];
     moveToNext(node.next);
  };

  const handleInputSubmit = () => {
     if (modalInput) {
         setLocalVars(prev => ({...prev, [modalInput]: Number(inputValue) || 0}));
     }
     setModalInput(null);
     const node = state.blocks[currentNodeId];
     moveToNext(node.next);
  };

  const renderModal = () => {
     if (modalText !== null) {
        return (
           <div style={{background:'white', padding: 20, borderRadius:8, minWidth:300}}>
              <p style={{marginBottom: 20, fontSize: 18}}>{modalText}</p>
              <button autoFocus onClick={handleNextMessage} style={{width:'100%', padding:10, background:'#3b82f6', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}>Continuar</button>
           </div>
        );
     }
     if (modalInput !== null) {
         return (
           <div style={{background:'white', padding: 20, borderRadius:8, minWidth:300}}>
              <p style={{marginBottom: 10, fontSize: 16}}>Ingresa el valor numérico para la variable <b>{modalInput}</b>:</p>
              <input type="number" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={(e) => {if(e.key==='Enter') handleInputSubmit()}} style={{width:'100%', marginBottom: 20, padding: 8}}/>
              <button onClick={handleInputSubmit} style={{width:'100%', padding:10, background:'#3b82f6', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}>Continuar</button>
           </div>
        );
     }
     return null;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{position: 'absolute', top: 20, right: 20}}>
         <button onClick={handleStop} style={{background:'red', color:'white', border:'none', padding:'8px 16px', borderRadius:4, fontWeight:'bold', cursor:'pointer'}}>Detener Simulación</button>
      </div>

      {renderModal()}
      
      <div style={{position: 'absolute', bottom: 20, left: 20, background:'white', padding: 10, borderRadius: 8, minWidth: 200, maxHeight: 300, overflow:'auto'}}>
         <h4>Variables Locales</h4>
         {Object.entries(localVars).map(([k, v]) => (
            <div key={k} style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #ccc', padding: '4px 0'}}>
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
         ))}
      </div>
    </div>
  );
}
