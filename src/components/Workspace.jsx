import React, { useEffect, useState, useRef } from 'react';
import { useDFDStore } from '../store';
import Block from './Block';
import Arrow from './Arrow';
import { Focus } from 'lucide-react';

export default function Workspace() {
  const { state } = useDFDStore();
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ pointerX: 0, pointerY: 0, initialPanX: 0, initialPanY: 0, multiplier: 1 });
  const containerRef = useRef(null);
  const mainRef = useRef(null);
  const pointersRef = useRef({});
  const initialDistRef = useRef(null);
  const initialScaleRef = useRef(1);

  const renderFlow = (nodeId) => {
    if (!nodeId) return null;
    const node = state.blocks[nodeId];
    if (!node) return null;

    if (node.type === 'CONDICIONAL') {
      return (
        <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Block id={node.id} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', marginTop: -50 }}>
            {/* NO Branch */}
            <div style={{ display: 'flex', width: '100%' }}>
              <div style={{ flex: 1 }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
                <div style={{ width: '100%', display: 'flex', height: 40 }}>
                   <div style={{ flex: 1 }}></div>
                   <div style={{ flex: 1, borderTop: '2px solid black', borderLeft: '2px solid black' }}></div>
                </div>
                <span style={{background:'white', padding: '0 4px', marginTop: -40, zIndex: 10}}>No</span>
                
                <Arrow height={15} />
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   {renderFlow(node.noBranch)}
                </div>
                
                <div style={{ width: 2, background: 'black', minHeight: 30, flex: 1 }}></div>
                
                <div style={{ width: '100%', display: 'flex', height: 40 }}>
                   <div style={{ flex: 1 }}></div>
                   <div style={{ flex: 1, borderBottom: '2px solid black', borderLeft: '2px solid black' }}></div>
                </div>
              </div>
              <div style={{ width: '40px', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ borderTop: '2px solid black', height: 40 }}></div>
                 <div style={{ flex: 1 }}></div>
                 <div style={{ borderBottom: '2px solid black', height: 40 }}></div>
              </div>
            </div>
            
            {/* SI Branch */}
            <div style={{ display: 'flex', width: '100%' }}>
              <div style={{ width: '40px', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ borderTop: '2px solid black', height: 40 }}></div>
                 <div style={{ flex: 1 }}></div>
                 <div style={{ borderBottom: '2px solid black', height: 40 }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
                <div style={{ width: '100%', display: 'flex', height: 40 }}>
                   <div style={{ flex: 1, borderTop: '2px solid black', borderRight: '2px solid black' }}></div>
                   <div style={{ flex: 1 }}></div>
                </div>
                <span style={{background:'white', padding: '0 4px', marginTop: -40, zIndex: 10}}>Si</span>
                
                <Arrow height={15} />
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   {renderFlow(node.yesBranch)}
                </div>
                
                <div style={{ width: 2, background: 'black', minHeight: 30, flex: 1 }}></div>
                
                <div style={{ width: '100%', display: 'flex', height: 40 }}>
                   <div style={{ flex: 1, borderBottom: '2px solid black', borderRight: '2px solid black' }}></div>
                   <div style={{ flex: 1 }}></div>
                </div>
              </div>
              <div style={{ flex: 1 }}></div>
            </div>
          </div>
          
          {/* Convergence Arrow */}
          <div style={{ height: 20, width: 2, background: 'black' }}></div>
          <Arrow height={10} />
          
          {renderFlow(node.next)}
        </div>
      );
    }
    
    if (node.type === 'MQ') {
       return (
        <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Block id={node.id} />
          <Arrow />
          <div style={{
             border: '2px dashed #f59e0b', padding: '20px', borderRadius: 8,
             display: 'flex', flexDirection: 'column', alignItems: 'center',
             minWidth: 100, minHeight: 40, backgroundColor: 'rgba(253, 230, 138, 0.1)'
          }}>
             {renderFlow(node.bodyBranch)}
          </div>
          <Arrow />
          {renderFlow(node.next)}
        </div>
       );
    }
    
    // Normal linear blocks
    return (
      <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Block id={node.id} />
        {node.next && <Arrow />}
        {renderFlow(node.next)}
      </div>
    );
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // Solo clic izquierdo en ratón
    
    // Registrar el puntero activo
    pointersRef.current[e.pointerId] = { x: e.clientX, y: e.clientY };

    if (Object.keys(pointersRef.current).length === 2) {
       // Iniciar Pinch-to-Zoom
       const pointers = Object.values(pointersRef.current);
       const dx = pointers[0].x - pointers[1].x;
       const dy = pointers[0].y - pointers[1].y;
       initialDistRef.current = Math.hypot(dx, dy);
       // Usar un valor funcional asíncrono no funcionaría con ref de inmediato, así que obtenemos el scale actual del estado
       setScale((prevScale) => {
          initialScaleRef.current = prevScale;
          return prevScale;
       });
       setIsDragging(false); // Detener el arrastre mientras se hace zoom
    } else if (Object.keys(pointersRef.current).length === 1) {
       setIsDragging(true);
       
       let multiplier = state.panSensitivity || 1;
       if ((e.pointerType === 'touch' || e.pointerType === 'pen') && window.innerWidth > 1200) {
          multiplier *= 2.5; 
       }
       
       setPan((prevPan) => {
          setStartPan({ 
             pointerX: e.clientX, 
             pointerY: e.clientY, 
             initialPanX: prevPan.x, 
             initialPanY: prevPan.y,
             multiplier
          });
          return prevPan;
       });
    }
  };

  const handlePointerMove = (e) => {
    if (pointersRef.current[e.pointerId]) {
       pointersRef.current[e.pointerId] = { x: e.clientX, y: e.clientY };
    }

    const activePointers = Object.keys(pointersRef.current);

    if (activePointers.length === 2 && initialDistRef.current !== null) {
       const pointers = Object.values(pointersRef.current);
       const dx = pointers[0].x - pointers[1].x;
       const dy = pointers[0].y - pointers[1].y;
       const currentDist = Math.hypot(dx, dy);
       const scaleFactor = currentDist / initialDistRef.current;
       
       const newScale = Math.min(Math.max(0.2, initialScaleRef.current * scaleFactor), 3);
       setScale(newScale);
       return;
    }

    if (activePointers.length === 1 && isDragging) {
      const deltaX = (e.clientX - startPan.pointerX) * startPan.multiplier;
      const deltaY = (e.clientY - startPan.pointerY) * startPan.multiplier;
      setPan({ x: startPan.initialPanX + deltaX, y: startPan.initialPanY + deltaY });
    }
  };

  const handlePointerUp = (e) => {
    delete pointersRef.current[e.pointerId];
    
    if (Object.keys(pointersRef.current).length < 2) {
       initialDistRef.current = null;
    }
    
    if (Object.keys(pointersRef.current).length === 0) {
       setIsDragging(false);
       
    // Al soltar un dedo en pinza, reiniciar las referencias para que el dedo restante no salte bruscamente al mover el mapa.
    } else if (Object.keys(pointersRef.current).length === 1) {
       const remainingPointer = Object.values(pointersRef.current)[0];
       let multiplier = state.panSensitivity || 1;
       if ((e.pointerType === 'touch' || e.pointerType === 'pen') && window.innerWidth > 1200) {
          multiplier *= 2.5; 
       }
       setIsDragging(true);
       setPan((prevPan) => {
          setStartPan({
             pointerX: remainingPointer.x,
             pointerY: remainingPointer.y,
             initialPanX: prevPan.x,
             initialPanY: prevPan.y,
             multiplier
          });
          return prevPan;
       });
    }
  };

  // Efecto para Wheel no-pasivo (soluciona warn ignorado de preventDefault en trackpads)
  useEffect(() => {
    const handleWheelNative = (e) => {
      if (e.ctrlKey) {
         e.preventDefault();
         setScale((prevScale) => Math.min(Math.max(0.2, prevScale - e.deltaY * 0.01), 3));
      }
    };
    
    const elem = mainRef.current;
    if (elem) {
       elem.addEventListener('wheel', handleWheelNative, { passive: false });
    }
    return () => {
       if (elem) elem.removeEventListener('wheel', handleWheelNative);
    };
  }, []);

  const centerWorkspace = () => {
     if (!containerRef.current || !containerRef.current.parentElement) return;
     const parent = containerRef.current.parentElement;
     const parentWidth = parent.clientWidth;
     const parentHeight = parent.clientHeight;
     
     let newScale = 1;
     let offsetY = 40;
     const flowElement = document.getElementById('dfd-flow-export');
     
     if (flowElement) {
         // Get real pixel size of the rendered nodes
         const flowWidth = flowElement.scrollWidth;
         const flowHeight = flowElement.scrollHeight;
         
         // Calculate zoom-to-fit with paddings
         const scaleX = (parentWidth - 80) / flowWidth;
         const scaleY = (parentHeight - 80) / flowHeight;
         newScale = Math.min(scaleX, scaleY, 1); // Max zoom 1x
         
         // Center vertically if it's smaller than the screen
         const leftoverY = parentHeight - (flowHeight * newScale);
         if (leftoverY > 80) {
             offsetY = leftoverY / 2;
         }
     }
     
     const offsetX = -(parentWidth / 2); 
     
     setScale(newScale);
     setPan({ x: offsetX, y: offsetY }); 
  };
  
  // Center on mount
  useEffect(() => {
     centerWorkspace();
  }, []);

  return (
    <main 
      className="workspace" 
      ref={mainRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerOut={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ position: 'relative', touchAction: 'none' }}
    >
      <div className="canvas-container" ref={containerRef} style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        transformOrigin: 'top center',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        minWidth: '200%', minHeight: '200%',
        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}>
        <div id="dfd-flow-export" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
           {renderFlow(state.head)}
        </div>
      </div>
      
      <button 
        onClick={centerWorkspace}
        style={{
          position: 'absolute', bottom: 'calc(20px + env(safe-area-inset-bottom))', left: 20,
          background: 'white', border: '1px solid #ccc', borderRadius: '50%',
          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
        title="Centrar Espacio de Trabajo"
      >
         <Focus size={20} />
      </button>
    </main>
  );
}
