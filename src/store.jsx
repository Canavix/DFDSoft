import { createContext, useContext, useReducer } from 'react';

const generateId = () => 'blk_' + Math.random().toString(36).substr(2, 9);

const initialState = {
  variables: [],
  blocks: {
    'start': { id: 'start', type: 'INICIO', next: 'end' },
    'end': { id: 'end', type: 'FIN', next: null }
  },
  head: 'start',
  editingBlockId: null,
  simulationActive: false,
  isSidebarOpen: window.innerWidth > 768,
};

const DFDContext = createContext();



function dfdReducer(state, action) {
  switch (action.type) {
    case 'ADD_VARIABLE':
      return { ...state, variables: [...state.variables, action.payload] };
    case 'EDIT_VARIABLE':
      return {
        ...state,
        variables: state.variables.map(v => v.name === action.payload.oldName ? action.payload.newVar : v)
      };
    case 'DELETE_VARIABLE':
      return {
        ...state,
        variables: state.variables.filter(v => v.name !== action.payload)
      };
    case 'ADD_BLOCK': {
      // payload = { type, targetId, branch }
      const newId = generateId();
      const newBlock = { id: newId, type: action.payload.type, next: null };
      
      const newBlocks = { ...state.blocks, [newId]: newBlock };
      
      if (action.payload.type === 'CONDICIONAL') {
        newBlock.yesBranch = null;
        newBlock.noBranch = null;
      }
      
      if (action.payload.type === 'MQ') {
         const endMqId = generateId();
         newBlocks[endMqId] = { id: endMqId, type: 'FIN_MQ', next: null, parentId: newId };
         newBlock.bodyBranch = null;
         
         const target = { ...newBlocks[action.payload.targetId] };
         const oldNext = target[action.payload.branch || 'next'];
         
         target[action.payload.branch || 'next'] = newId;
         newBlock.next = endMqId;
         newBlocks[endMqId].next = oldNext;
         
         newBlocks[action.payload.targetId] = target;
      } else {
         const target = { ...newBlocks[action.payload.targetId] };
         const branch = action.payload.branch || 'next';
         const oldNext = target[branch];
         
         target[branch] = newId;
         newBlock.next = oldNext;
         
         newBlocks[action.payload.targetId] = target;
      }
      
      return { ...state, blocks: newBlocks };
    }
    case 'SET_EDITING_BLOCK':
      return { ...state, editingBlockId: action.payload };
    case 'SET_SIMULATION_ACTIVE':
      return { ...state, simulationActive: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case 'UPDATE_BLOCK':
      return {
        ...state,
        blocks: {
          ...state.blocks,
          [action.payload.id]: action.payload
        }
      };
    case 'SET_STATE':
      return action.payload;
    case 'REMOVE_BLOCK': {
      const idToRemove = action.payload;
      const blockToRemove = state.blocks[idToRemove];
      if (!blockToRemove || blockToRemove.type === 'INICIO' || blockToRemove.type === 'FIN') return state;

      let parent = null;
      let branchPointer = null;
      for (const [id, b] of Object.entries(state.blocks)) {
         if (b.next === idToRemove) { parent = b; branchPointer = 'next'; break; }
         if (b.yesBranch === idToRemove) { parent = b; branchPointer = 'yesBranch'; break; }
         if (b.noBranch === idToRemove) { parent = b; branchPointer = 'noBranch'; break; }
         if (b.bodyBranch === idToRemove) { parent = b; branchPointer = 'bodyBranch'; break; }
      }
      
      const newBlocks = { ...state.blocks };
      let destination = blockToRemove.next;
      
      if (blockToRemove.type === 'MQ') {
         const finMqId = Object.values(state.blocks).find(b => b.type === 'FIN_MQ' && b.parentId === idToRemove)?.id;
         if (finMqId && newBlocks[finMqId]) {
             destination = newBlocks[finMqId].next;
             delete newBlocks[finMqId]; // also remove the end marker from memory
         }
      }
      
      if (parent) {
         parent[branchPointer] = destination;
      }
      
      // If we are deleting a condicional, its internal branches are orphaned, but that's fine memory-wise or we can do garbage collection.
      delete newBlocks[idToRemove];
      
      return { ...state, blocks: newBlocks };
    }
    default:
      return state;
  }
}

export function DFDProvider({ children }) {
  const [state, dispatch] = useReducer(dfdReducer, initialState);
  return (
    <DFDContext.Provider value={{ state, dispatch }}>
      {children}
    </DFDContext.Provider>
  );
}

export function useDFDStore() {
  return useContext(DFDContext);
}
