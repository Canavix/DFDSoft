import { Diagram } from './diagram.js';
import { Renderer } from './renderer.js';
import { Simulator } from './simulator.js';
import { Storage } from './storage.js';

window.ui = {
    showAlert: (message, title = 'Aviso') => {
        return new Promise(resolve => {
            const modal = document.getElementById('modal-alert');
            document.getElementById('alert-title').textContent = title;
            document.getElementById('alert-message').textContent = message;

            const btnOk = document.getElementById('btn-alert-ok');
            btnOk.onclick = () => {
                modal.classList.remove('active');
                resolve();
            };

            modal.classList.add('active');
        });
    },
    showPrompt: (message, defaultValue = '') => {
        return new Promise(resolve => {
            const modal = document.getElementById('modal-prompt');
            document.getElementById('prompt-title').textContent = message;
            const input = document.getElementById('prompt-input');
            input.value = defaultValue;

            const btnOk = document.getElementById('btn-prompt-ok');
            const btnCancel = document.getElementById('btn-prompt-cancel');

            btnOk.onclick = () => {
                modal.classList.remove('active');
                resolve(input.value);
            };

            btnCancel.onclick = () => {
                modal.classList.remove('active');
                resolve(null);
            };

            modal.classList.add('active');
            input.focus();
        });
    }
};

class App {
    constructor() {
        this.diagram = new Diagram();
        this.renderer = new Renderer(this.diagram);
        this.simulator = new Simulator(this.diagram, this.renderer);
        this.storage = new Storage(this.diagram, this.renderer);

        this.initPWA();
        this.initUI();
        this.initInteractiveGraph();
        this.initZoomAndPan();
        this.initNodeConfig();

        // Initial render
        this.renderer.render();
    }

    initPWA() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch(err => {
                    console.log('SW registration failed: ', err);
                });
            });
        }
    }

    initUI() {
        // Modals
        const modalVars = document.getElementById('modal-variables');
        const btnManageVars = document.getElementById('btn-manage-vars');

        btnManageVars.addEventListener('click', () => {
            modalVars.classList.add('active');
            this.simulator.renderVariablesList();
        });

        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        document.getElementById('btn-play').addEventListener('click', () => this.simulator.play());
        document.getElementById('btn-stop').addEventListener('click', () => this.simulator.stop());

        // File controls
        document.getElementById('btn-new').addEventListener('click', async () => {
            // Reusing prompt modal format for a simple confirmation
            const modal = document.getElementById('modal-cond-branch');
            modal.querySelector('h3').textContent = '¿Si crea un nuevo archivo, perderá los cambios no guardados. Desea continuar?';
            const btnSi = document.getElementById('btn-branch-si');
            const btnNo = document.getElementById('btn-branch-cancel');
            document.getElementById('btn-branch-no').style.display = 'none';

            btnSi.replaceWith(btnSi.cloneNode(true));
            btnNo.replaceWith(btnNo.cloneNode(true));

            const newSi = document.getElementById('btn-branch-si');
            const newNo = document.getElementById('btn-branch-cancel');

            newSi.addEventListener('click', () => {
                modal.classList.remove('active');
                this.diagram.initDefaultFlow();
                this.renderer.render();
                // Restore defaults for later use
                document.getElementById('btn-branch-no').style.display = 'inline-block';
                modal.querySelector('h3').textContent = '¿En cuál lado deseas insertar el bloque?';
            }, { once: true });

            newNo.addEventListener('click', () => {
                modal.classList.remove('active');
                document.getElementById('btn-branch-no').style.display = 'inline-block';
                modal.querySelector('h3').textContent = '¿En cuál lado deseas insertar el bloque?';
            }, { once: true });

            modal.classList.add('active');
        });
        document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-input').click());
        document.getElementById('file-input').addEventListener('change', (e) => this.storage.importFile(e));
        document.getElementById('btn-export-file').addEventListener('click', () => this.storage.exportFile());
        document.getElementById('btn-export-img').addEventListener('click', () => this.storage.exportImage());

        // Variable management
        document.getElementById('btn-add-var').addEventListener('click', () => this.simulator.addVariable());

        // History controls
        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');

        btnUndo.addEventListener('click', () => {
            this.diagram.undo();
            this.renderer.render();
        });

        btnRedo.addEventListener('click', () => {
            this.diagram.redo();
            this.renderer.render();
        });

        window.addEventListener('history-changed', () => {
            btnUndo.disabled = this.diagram.historyIndex <= 0;
            btnUndo.style.opacity = btnUndo.disabled ? '0.5' : '1';

            btnRedo.disabled = this.diagram.historyIndex >= this.diagram.history.length - 1;
            btnRedo.style.opacity = btnRedo.disabled ? '0.5' : '1';
        });
    }

    initInteractiveGraph() {
        const overlay = document.getElementById('node-overlay');
        const btnAdd = document.getElementById('btn-overlay-add');
        const btnDelete = document.getElementById('btn-overlay-delete');
        const svg = document.getElementById('canvas');

        // Close overlay when clicking background
        svg.addEventListener('click', (e) => {
            if (e.target.tagName === 'svg' || e.target.id === 'grid-layer') {
                overlay.style.display = 'none';
                this.selectedNodeId = null;
                // clear optional highlights
                const nodes = document.querySelectorAll('.node-group');
                nodes.forEach(n => { n.firstElementChild.setAttribute('stroke', '#ffffff33'); });
            }
        });

        // Listen for Node clicks
        window.addEventListener('node-selected', (e) => {
            const { id, element } = e.detail;
            this.selectedNodeId = id;

            // Highlight selected node
            const nodes = document.querySelectorAll('.node-group');
            nodes.forEach(n => { n.firstElementChild.setAttribute('stroke', '#ffffff33'); });
            element.firstElementChild.setAttribute('stroke', '#ffeb3b');

            // Calculate bounding box in HTML viewport
            const bbox = element.getBoundingClientRect();

            // Node type specific rules for overlay
            const nodeData = this.diagram.nodes.find(n => n.id === id);

            // Adjust overlay position (anchor right)
            overlay.style.left = `${bbox.right + 10}px`;
            overlay.style.top = `${bbox.top}px`;
            overlay.style.display = 'flex';

            // Hide add/delete conditionally
            if (nodeData.type === 'start') {
                btnDelete.style.display = 'none';
                btnAdd.style.display = 'flex';
            } else if (nodeData.type === 'end') {
                btnDelete.style.display = 'none';
                btnAdd.style.display = 'none'; // End node can't have offspring
            } else if (nodeData.type === 'join') {
                btnDelete.style.display = 'none';
                btnAdd.style.display = 'flex';
            } else if (nodeData.type === 'while_end') {
                btnDelete.style.display = 'none'; // Deleted via 'while'
                btnAdd.style.display = 'flex';
            } else {
                btnDelete.style.display = 'flex';
                btnAdd.style.display = 'flex';
            }
        });

        // Delete button logic
        btnDelete.addEventListener('click', () => {
            if (!this.selectedNodeId) return;
            // Native delete logic wrapper
            if (confirm("¿Estás seguro de que deseas eliminar este bloque?")) {
                this.diagram.deleteNode(this.selectedNodeId);
                this.selectedNodeId = null;
                overlay.style.display = 'none';
                this.renderer.render();
            }
        });

        // Add button logic
        btnAdd.addEventListener('click', () => {
            if (!this.selectedNodeId) return;
            const node = this.diagram.nodes.find(n => n.id === this.selectedNodeId);

            if (node.type === 'conditional') {
                // Conditional asks for Si/No first
                const modalConfirm = document.getElementById('modal-cond-branch');
                modalConfirm.classList.add('active');

                // Set text generic
                modalConfirm.querySelector('h3').textContent = '¿En cuál lado deseas insertar el bloque?';

                const btnSi = document.getElementById('btn-branch-si');
                const btnNo = document.getElementById('btn-branch-no');
                const btnCancel = document.getElementById('btn-branch-cancel');

                const cleanup = () => {
                    modalConfirm.classList.remove('active');
                    btnSi.replaceWith(btnSi.cloneNode(true));
                    btnNo.replaceWith(btnNo.cloneNode(true));
                    btnCancel.replaceWith(btnCancel.cloneNode(true));
                };

                const handleChoice = (isSi) => {
                    cleanup();
                    // Open block chooser
                    this.pendingInsertionObj = { targetId: this.selectedNodeId, isSi: isSi };
                    document.getElementById('modal-insert-block').classList.add('active');
                };

                btnSi.addEventListener('click', () => handleChoice(true), { once: true });
                btnNo.addEventListener('click', () => handleChoice(false), { once: true });
                btnCancel.addEventListener('click', cleanup, { once: true });
            } else {
                // Std flow
                this.pendingInsertionObj = { targetId: this.selectedNodeId, isSi: null };
                document.getElementById('modal-insert-block').classList.add('active');
            }
        });

        // Global function for modal to call
        window.insertPendingBlock = (type) => {
            if (!this.pendingInsertionObj) return;
            document.getElementById('modal-insert-block').classList.remove('active');

            const { targetId, isSi } = this.pendingInsertionObj;
            this.pendingInsertionObj = null;
            overlay.style.display = 'none';

            // Coordinate inject
            const node = this.diagram.nodes.find(n => n.id === targetId);
            let explicitConn = null;

            if (node.type === 'conditional' && isSi !== null) {
                const branchType = isSi ? 'true' : 'false';
                explicitConn = this.diagram.getBranchTailConnection(targetId, branchType);
                this.diagram.addNode(type, 0, 0, explicitConn);
            } else if (node.type === 'while') {
                explicitConn = this.diagram.connections.find(c => c.source === targetId && c.type === 'true');
                this.diagram.addNode(type, 0, 0, explicitConn);
            } else if (node.type === 'while_end') {
                const whileNode = this.diagram.nodes.find(n => n.type === 'while' && n.data.closedId === targetId);
                explicitConn = this.diagram.connections.find(c => c.source === whileNode.id && c.type === 'false');
                this.diagram.addNode(type, 0, 0, explicitConn);
            } else {
                explicitConn = this.diagram.connections.find(c => c.source === targetId && c.type === 'main');
                this.diagram.addNode(type, 0, 0, explicitConn);
            }

            this.renderer.render();
        };
    }

    initZoomAndPan() {
        let isPanning = false;
        let startPt = { x: 0, y: 0 };
        const svg = document.getElementById('canvas');
        const transformLayer = document.getElementById('transform-layer');

        // Pan state
        this.pan = { x: 0, y: 0 };
        this.zoom = 1;

        const updateTransform = () => {
            transformLayer.setAttribute('transform', `translate(${this.pan.x}, ${this.pan.y}) scale(${this.zoom})`);
            // Update grid background size conceptually to match pan, though SVG patterns handle it differently.
            // A simple approach is to translate the grid pattern.
            const grid = document.getElementById('grid');
            grid.setAttribute('patternTransform', `translate(${this.pan.x}, ${this.pan.y}) scale(${this.zoom})`);
        };

        // Panning (Mouse/Touch)
        svg.addEventListener('mousedown', (e) => {
            if (e.target.tagName !== 'svg' && e.target.id !== 'grid-layer') return; // Only pan if clicking background
            isPanning = true;
            startPt = { x: e.clientX - this.pan.x, y: e.clientY - this.pan.y };
            svg.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            this.pan.x = e.clientX - startPt.x;
            this.pan.y = e.clientY - startPt.y;
            updateTransform();
        });

        window.addEventListener('mouseup', () => {
            if (isPanning) {
                isPanning = false;
                svg.style.cursor = 'grab';
            }
        });

        // Zooming (Wheel)
        svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;

            // Zoom towards mouse pointer
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

            this.zoom *= zoomDelta;

            // Limit zoom
            this.zoom = Math.max(0.2, Math.min(this.zoom, 3));

            updateTransform();
        });

        // Buttons
        document.getElementById('btn-zoom-in').addEventListener('click', () => {
            this.zoom = Math.min(this.zoom * 1.2, 3);
            updateTransform();
        });

        document.getElementById('btn-zoom-out').addEventListener('click', () => {
            this.zoom = Math.max(this.zoom * 0.8, 0.2);
            updateTransform();
        });

        document.getElementById('btn-zoom-reset').addEventListener('click', () => {
            const bbox = document.getElementById('nodes-layer').getBBox();
            if (bbox.width === 0) {
                this.zoom = 1;
                this.pan = { x: 0, y: 0 };
            } else {
                const margin = 60;
                const svgWidth = canvas.clientWidth;
                const svgHeight = canvas.clientHeight;

                const scaleX = svgWidth / (bbox.width + margin * 2);
                const scaleY = svgHeight / (bbox.height + margin * 2);

                this.zoom = Math.min(1.5, Math.min(scaleX, scaleY));

                const cx = bbox.x + bbox.width / 2;
                const cy = bbox.y + bbox.height / 2;

                this.pan.x = (svgWidth / 2) - (cx * this.zoom);
                this.pan.y = (svgHeight / 2) - (cy * this.zoom);
            }
            updateTransform();
        });

        // Expose to renderer
        this.renderer.setTransformState(this.zoom, this.pan);
    }

    initNodeConfig() {
        const modal = document.getElementById('modal-config');
        const body = document.getElementById('config-body');
        const title = document.getElementById('config-title');
        let currentNodeId = null;

        window.addEventListener('node-config', (e) => {
            currentNodeId = e.detail;
            const node = this.diagram.nodes.find(n => n.id === currentNodeId);
            if (!node) return;

            // Generate form based on type
            let html = '';
            // Fetch var alternatives
            const varOpts = Object.keys(this.simulator.variables).map(v => `<option value="${v}">${v}</option>`).join('');

            switch (node.type) {
                case 'output':
                    title.textContent = 'Configurar Salida de Datos';
                    html = `
                        <div style="margin-bottom: 1rem;">
                            <label>Texto a mostrar (usar 'comillas' para texto fijo):</label>
                            <input type="text" id="cfg-output" class="form-input" value='${node.data.text.replace(/'/g, "&#39;")}' style="width:100%; padding:0.5rem; margin-top:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); color:var(--text-primary);">
                        </div>
                    `;
                    break;
                case 'input':
                    title.textContent = 'Configurar Entrada de Datos';
                    html = `
                        <div style="margin-bottom: 1rem;">
                            <label>Variable donde asignar valor:</label>
                            <select id="cfg-input" class="form-input" style="width:100%; padding:0.5rem; margin-top:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); color:var(--text-primary);">
                                <option value="">-- Seleccionar --</option>
                                ${varOpts}
                            </select>
                        </div>
                        <small style="color:var(--text-secondary)">Debes crear variables en "Gestionar Variables" primero.</small>
                    `;
                    break;
                case 'action':
                    title.textContent = 'Configurar Acción (Operación)';
                    html = `
                        <div style="display:flex; flex-direction:column; gap:0.5rem;">
                            <label>Variable Destino:</label>
                            <select id="cfg-target" class="form-input" style="padding:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); color:white;">
                                <option value="">-- Seleccionar --</option>
                                ${varOpts}
                            </select>
                            
                            <label>Asignación:</label>
                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                <input type="text" id="cfg-op1" value="${node.data.operand1}" placeholder="Valor/Var 1" style="flex:1; padding:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); color:white;">
                                <select id="cfg-operator" style="padding:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); color:white;">
                                    <option value="+" ${node.data.operator === '+' ? 'selected' : ''}>+</option>
                                    <option value="-" ${node.data.operator === '-' ? 'selected' : ''}>-</option>
                                    <option value="*" ${node.data.operator === '*' ? 'selected' : ''}>*</option>
                                    <option value="/" ${node.data.operator === '/' ? 'selected' : ''}>/</option>
                                    <option value="=" ${node.data.operator === '=' ? 'selected' : ''}>= (Directo)</option>
                                </select>
                                <input type="text" id="cfg-op2" value="${node.data.operand2}" placeholder="Valor/Var 2" style="flex:1; padding:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); color:white;">
                            </div>
                        </div>
                    `;
                    break;
                case 'conditional':
                case 'while':
                    title.textContent = node.type === 'conditional' ? 'Configurar Condición (SI/NO)' : 'Configurar Condición Mientras Que';
                    html = `
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <input type="text" id="cfg-op1" value="${node.data.operand1}" placeholder="Valor/Var 1" style="flex:1; padding:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); color:white;">
                            <select id="cfg-operator" style="padding:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); color:white;">
                                <option value="=" ${node.data.operator === '=' ? 'selected' : ''}>=</option>
                                <option value="!=" ${node.data.operator === '!=' ? 'selected' : ''}>!=</option>
                                <option value="<" ${node.data.operator === '<' ? 'selected' : ''}>&lt;</option>
                                <option value="<=" ${node.data.operator === '<=' ? 'selected' : ''}>&lt;=</option>
                                <option value=">" ${node.data.operator === '>' ? 'selected' : ''}>&gt;</option>
                                <option value=">=" ${node.data.operator === '>=' ? 'selected' : ''}>&gt;=</option>
                            </select>
                            <input type="text" id="cfg-op2" value="${node.data.operand2}" placeholder="Valor/Var 2" style="flex:1; padding:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); color:white;">
                        </div>
                    `;
                    break;
            }

            body.innerHTML = html;

            // Re-select dropdowns to preserve input selections natively created dynamically
            if (node.type === 'input') document.getElementById('cfg-input').value = node.data.variable;
            if (node.type === 'action') document.getElementById('cfg-target').value = node.data.target;

            modal.classList.add('active');
        });

        document.getElementById('btn-save-config').addEventListener('click', () => {
            if (!currentNodeId) return;
            const node = this.diagram.nodes.find(n => n.id === currentNodeId);

            switch (node.type) {
                case 'output':
                    node.data.text = document.getElementById('cfg-output').value;
                    node.data.label = node.data.text.substring(0, 10) + '...';
                    break;
                case 'input':
                    node.data.variable = document.getElementById('cfg-input').value;
                    node.data.label = `Leer ${node.data.variable}`;
                    break;
                case 'action':
                    node.data.target = document.getElementById('cfg-target').value;
                    node.data.operand1 = document.getElementById('cfg-op1').value;
                    node.data.operator = document.getElementById('cfg-operator').value;
                    node.data.operand2 = document.getElementById('cfg-op2').value;
                    if (node.data.operator === '=') {
                        node.data.label = `${node.data.target} = ${node.data.operand1}`;
                    } else {
                        node.data.label = `${node.data.target} = ${node.data.operand1} ${node.data.operator} ${node.data.operand2}`;
                    }
                    break;
                case 'conditional':
                case 'while':
                    node.data.operand1 = document.getElementById('cfg-op1').value;
                    node.data.operator = document.getElementById('cfg-operator').value;
                    node.data.operand2 = document.getElementById('cfg-op2').value;
                    node.data.label = `${node.data.operand1} ${node.data.operator} ${node.data.operand2}`;
                    break;
            }

            document.getElementById('modal-config').classList.remove('active');
            this.renderer.render();
        });
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
