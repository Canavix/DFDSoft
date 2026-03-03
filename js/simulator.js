export class Simulator {
    constructor(diagram, renderer) {
        this.diagram = diagram;
        this.renderer = renderer;
        this.variables = {}; // { NAME: { value: 0 } }
        this.isRunning = false;
        this.currentStepId = null;
    }

    renderVariablesList() {
        const list = document.getElementById('variables-list');
        list.innerHTML = '';

        Object.entries(this.variables).forEach(([name, data]) => {
            const div = document.createElement('div');
            div.className = 'variable-item';
            div.innerHTML = `
                <div class="variable-info">
                    <span class="var-name">${name}</span>
                    <span class="var-val">= ${data.value}</span>
                </div>
                <div class="variable-actions">
                    <button title="Editar" class="edit"><i class="fa-solid fa-pen"></i></button>
                    <button title="Eliminar" class="delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            div.querySelector('.delete').addEventListener('click', () => {
                delete this.variables[name];
                this.renderVariablesList();
            });

            div.querySelector('.delete').addEventListener('click', () => {
                delete this.variables[name];
                this.renderVariablesList();
            });

            // Edit basic logic
            div.querySelector('.edit').addEventListener('click', async () => {
                const newVal = await window.ui.showPrompt(`Nuevo valor para ${name}:`, data.value);
                if (newVal !== null && !isNaN(parseFloat(newVal))) {
                    this.variables[name].value = parseFloat(newVal);
                    this.renderVariablesList();
                }
            });

            list.appendChild(div);
        });
    }

    addVariable() {
        const nameInput = document.getElementById('new-var-name');
        const valInput = document.getElementById('new-var-value');

        let name = nameInput.value.trim().toUpperCase();
        let val = parseFloat(valInput.value);
        if (isNaN(val)) val = 0;

        if (name) {
            // validate valid variable name (alphanumeric, no spaces or starting number)
            if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) {
                window.ui.showAlert("Nombre de variable inválido.", "Error");
                return;
            }
            this.variables[name] = { value: val };
            this.renderVariablesList();
            nameInput.value = '';
            valInput.value = '0';
        }
    }

    play() {
        if (this.isRunning) return;
        this.isRunning = true;

        document.getElementById('btn-play').classList.add('hidden');
        document.getElementById('btn-stop').classList.remove('hidden');
        document.getElementById('btn-stop').disabled = false;

        // Reset highlights
        const nodes = document.querySelectorAll('.node-group rect, .node-group polygon');
        nodes.forEach(n => { n.style.filter = ''; n.setAttribute('stroke', '#ffffff33'); });

        this.currentStepId = 'node_start';
        this.highlightNode(this.currentStepId);

        this.runNextStep();
    }

    runNextStep() {
        if (!this.isRunning) return;
        setTimeout(() => {
            this.step();
        }, 300); // reduced from 800ms to 300ms for faster execution
    }

    async step() {
        if (!this.isRunning) return;

        const node = this.diagram.nodes.find(n => n.id === this.currentStepId);
        if (!node) { this.stop(); return; }

        let nextConnType = 'main';
        let error = false;

        try {
            switch (node.type) {
                case 'start':
                case 'join':
                case 'while_end':
                    // Just pass through
                    break;

                case 'output':
                    let outText = node.data.text.trim();
                    if ((outText.startsWith('"') && outText.endsWith('"')) || (outText.startsWith("'") && outText.endsWith("'"))) {
                        await window.ui.showAlert(outText.substring(1, outText.length - 1), "Salida de Datos");
                    } else {
                        // try to evaluate as variables (comma separated)
                        const parts = outText.split(',').map(p => p.trim());
                        const res = parts.map(p => {
                            if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
                                return p.substring(1, p.length - 1);
                            }
                            if (this.variables[p]) return this.variables[p].value;
                            return p; // fallback to raw string instead of crashing
                        }).join(' ');
                        await window.ui.showAlert(res, "Salida de Datos");
                    }
                    break;

                case 'input':
                    if (!node.data.variable || !this.variables[node.data.variable]) throw new Error('Variable no existe');
                    const val = await window.ui.showPrompt(`Ingresa un valor para ${node.data.variable}:`);
                    if (val === null) throw new Error('Cancelado'); // User cancelled
                    const parsed = parseFloat(val);
                    if (isNaN(parsed)) throw new Error('No es un número');
                    this.variables[node.data.variable].value = parsed;
                    this.renderVariablesList();
                    break;

                case 'action':
                    if (!node.data.target || !this.variables[node.data.target]) throw new Error('Target invalid');
                    const v1 = this.resolveValue(node.data.operand1);
                    if (node.data.operator === '=') {
                        this.variables[node.data.target].value = v1;
                    } else {
                        const v2 = this.resolveValue(node.data.operand2);
                        let res = 0;
                        if (node.data.operator === '+') res = v1 + v2;
                        if (node.data.operator === '-') res = v1 - v2;
                        if (node.data.operator === '*') res = v1 * v2;
                        if (node.data.operator === '/') res = v1 / v2;
                        this.variables[node.data.target].value = res;
                    }
                    this.renderVariablesList();
                    break;

                case 'conditional':
                case 'while':
                    const cv1 = this.resolveValue(node.data.operand1);
                    const cv2 = this.resolveValue(node.data.operand2);
                    let conditionMet = false;
                    const op = node.data.operator;
                    if (op === '=') conditionMet = cv1 === cv2;
                    if (op === '!=') conditionMet = cv1 !== cv2;
                    if (op === '>') conditionMet = cv1 > cv2;
                    if (op === '<') conditionMet = cv1 < cv2;
                    if (op === '>=') conditionMet = cv1 >= cv2;
                    if (op === '<=') conditionMet = cv1 <= cv2;

                    nextConnType = conditionMet ? 'true' : 'false';
                    break;

                case 'end':
                    await window.ui.showAlert("Se ha terminado la ejecución del algoritmo.", "Fin");
                    this.stop();
                    return;
            }
        } catch (e) {
            console.error("Execution error:", e);
            error = true;
        }

        let hasMoved = false;

        if (!error) {
            // Find next node based on connection and branch type
            const conns = this.diagram.connections.filter(c => c.source === this.currentStepId);
            let currentConn = conns.find(c => c.type === nextConnType);

            // fallback if main but only true/false defined or something 
            // (should not happen with good layout logic but safe guard)
            if (!currentConn && conns.length > 0) currentConn = conns[0];

            // Edge case: while_end connects back to while (loop)
            if (node.type === 'while_end') {
                currentConn = conns.find(c => c.type === 'loop');
            }

            if (currentConn) {
                this.renderer.render(); // Clear previous highlights visually
                this.currentStepId = currentConn.target;
                this.highlightNode(this.currentStepId);

                // Continua auto ejecución
                this.runNextStep();
                hasMoved = true;
            }
        }

        if (!hasMoved) {
            // dead end or error
            this.stopBtnKeep();
        }
    }

    resolveValue(valStr) {
        valStr = String(valStr).trim();
        if (this.variables[valStr]) return this.variables[valStr].value;
        const parsed = parseFloat(valStr);
        if (!isNaN(parsed)) return parsed;
        throw new Error(`Invalid value: ${valStr}`);
    }

    stopBtnKeep() {
        this.isRunning = false;
        document.getElementById('btn-play').classList.remove('hidden');
        document.getElementById('btn-stop').classList.add('hidden');
    }

    stop() {
        this.isRunning = false;
        this.currentStepId = null;
        document.getElementById('btn-play').classList.remove('hidden');
        document.getElementById('btn-stop').classList.add('hidden');

        // Clear all highlights
        const nodes = document.querySelectorAll('.node-group rect, .node-group polygon, .node-group circle');
        nodes.forEach(n => { n.style.filter = ''; n.setAttribute('stroke', '#ffffff33'); });
    }

    highlightNode(id) {
        const g = document.querySelector(`.node-group[transform*="${this.diagram.nodes.find(n => n.id === id).x}"]`); // Needs exact matching technically

        // A more robust way to find element using DOM traversal if class doesn't match perfectly
        // Better: Find node in data, re-render with a 'highlighted' flag. But DOM manipulation is faster.
        const allGroups = document.querySelectorAll('.node-group');
        const nodeData = this.diagram.nodes.find(n => n.id === id);
        if (!nodeData) return;

        allGroups.forEach(g => {
            const transform = g.getAttribute('transform');
            if (transform.includes(`translate(${nodeData.x}, ${nodeData.y})`)) {
                const shape = g.querySelector('rect, polygon, circle');
                if (shape) {
                    shape.style.filter = "drop-shadow(0 0 15px #ffebeb) brightness(1.3)";
                    shape.setAttribute('stroke', '#fff');
                    shape.setAttribute('stroke-width', '4');
                }
            } else {
                const shape = g.querySelector('rect, polygon, circle');
                if (shape) {
                    shape.style.filter = '';
                    shape.setAttribute('stroke', '#ffffff33');
                    shape.setAttribute('stroke-width', '2');
                }
            }
        });
    }

    highlightError(id) {
        const allGroups = document.querySelectorAll('.node-group');
        const nodeData = this.diagram.nodes.find(n => n.id === id);
        if (!nodeData) return;

        allGroups.forEach(g => {
            const transform = g.getAttribute('transform');
            if (transform.includes(`translate(${nodeData.x}, ${nodeData.y})`)) {
                const shape = g.querySelector('rect, polygon, circle');
                if (shape) {
                    shape.style.filter = "drop-shadow(0 0 20px rgba(239,68,68,0.8))";
                    shape.setAttribute('fill', 'var(--accent-red)');
                    shape.setAttribute('stroke', 'white');
                    shape.setAttribute('stroke-width', '4');
                }
            }
        });
    }
}
