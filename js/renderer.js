export class Renderer {
    constructor(diagram) {
        this.diagram = diagram;
        this.svg = document.getElementById('canvas');
        this.nodesLayer = document.getElementById('nodes-layer');
        this.connectionsLayer = document.getElementById('connections-layer');

        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.draggingNode = null;
        this.dragOffset = { x: 0, y: 0 };

        this.initNodeDragging();
    }

    setTransformState(zoom, pan) {
        this.zoom = zoom;
        this.pan = pan;
    }

    initNodeDragging() {
        const trash = document.getElementById('trash-area');

        window.addEventListener('mousemove', (e) => {
            if (this.draggingNode) {
                const pt = this.svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const svgP = pt.matrixTransform(this.nodesLayer.getScreenCTM().inverse());

                this.diagram.updateNodePosition(this.draggingNode.id, svgP.x - this.dragOffset.x, svgP.y - this.dragOffset.y);
                this.render();

                // Trash collision check (using screen coords)
                const trashRect = trash.getBoundingClientRect();
                if (e.clientX > trashRect.left && e.clientX < trashRect.right &&
                    e.clientY > trashRect.top && e.clientY < trashRect.bottom) {
                    trash.classList.add('drag-hover');
                } else {
                    trash.classList.remove('drag-hover');
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (this.draggingNode) {
                const trashRect = trash.getBoundingClientRect();
                if (e.clientX > trashRect.left && e.clientX < trashRect.right &&
                    e.clientY > trashRect.top && e.clientY < trashRect.bottom) {
                    // Delete node
                    this.diagram.deleteNode(this.draggingNode.id);
                    this.render();
                }
                trash.classList.remove('drag-hover');
                this.draggingNode = null;
            }
        });
    }

    render() {
        this.nodesLayer.innerHTML = '';
        this.connectionsLayer.innerHTML = '';

        // Render Connections
        this.diagram.connections.forEach(conn => {
            this.drawConnection(conn);
        });

        // Render Nodes
        this.diagram.nodes.forEach(node => {
            this.drawNode(node);
        });
    }

    drawConnection(conn) {
        const source = this.diagram.nodes.find(n => n.id === conn.source);
        const target = this.diagram.nodes.find(n => n.id === conn.target);

        if (!source || !target) return;

        const x1 = source.x + 60;
        let y1 = source.y + 60;
        const x2 = target.x + 60;
        const y2 = target.y;

        // Custom start points for branches
        if (source.type === 'conditional') {
            if (conn.type === 'false') {
                // start from left point
                y1 = source.y + 30; // middle
                // x1 remains modified in path logic
            } else if (conn.type === 'true') {
                // start from right point
                y1 = source.y + 30; // middle
            }
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        let d = '';
        if (conn.type === 'loop') {
            // draw rectangular loop from while_end (bottom) up to while (top).
            // Go around the left side, then over the top, and drop down connecting perfectly to the top edge.
            d = `M ${x1} ${y1 + 15} L ${x1 - 90} ${y1 + 15} L ${x1 - 90} ${y2 - 20} L ${x1} ${y2 - 20} L ${x1} ${y2}`;
        } else if (source.type === 'conditional' && conn.type === 'false') {
            // "No" branch layout logic
            const yDrop = (target.y !== undefined) ? target.y + 15 : y1 + 100;
            d = `M ${source.x} ${y1} L ${source.x - 40} ${y1} L ${source.x - 40} ${yDrop} L ${x2} ${yDrop}`;
        } else if (source.type === 'conditional' && conn.type === 'true') {
            // "Si" branch layout logic
            const yDrop = (target.y !== undefined) ? target.y + 15 : y1 + 100;
            d = `M ${source.x + 120} ${y1} L ${source.x + 160} ${y1} L ${source.x + 160} ${yDrop} L ${x2} ${yDrop}`;
        } else {
            // Vertical straight-ish line
            d = `M ${x1} ${y1} L ${x1} ${(y1 + y2) / 2} L ${x2} ${(y1 + y2) / 2} L ${x2} ${y2}`;
        }

        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#8b949e');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('class', 'connection-path');
        path.setAttribute('marker-end', 'url(#arrowhead)');

        this.connectionsLayer.appendChild(path);

        // Add SI/NO labels only for conditionals (not whiles)
        if (source.type === 'conditional' && (conn.type === 'true' || conn.type === 'false')) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', conn.type === 'false' ? source.x - 20 : source.x + 140);
            text.setAttribute('y', y1 - 8);
            text.setAttribute('fill', '#8b949e');
            text.setAttribute('font-size', '14px');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-family', 'Inter, sans-serif');
            text.textContent = conn.type === 'true' ? 'SI' : 'NO';
            this.connectionsLayer.appendChild(text);
        }
    }

    drawNode(node) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        g.setAttribute('class', `node-group node-${node.type}`);
        g.setAttribute('data-id', node.id);
        g.style.cursor = 'pointer';

        g.addEventListener('click', (e) => {
            e.stopPropagation();
            console.warn(`[DEBUG] Clicked Node: ${node.id} (${node.type})`);
            window.dispatchEvent(new CustomEvent('node-selected', { detail: { id: node.id, element: g } }));
        });

        g.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            console.warn(`[DEBUG] DBL Clicked Node: ${node.id} (${node.type})`);
            if (['start', 'end', 'join', 'while_end'].includes(node.type)) return;
            window.dispatchEvent(new CustomEvent('node-config', { detail: node.id }));
        });

        let shape;
        const width = 120;
        const height = 60;

        const getFill = (type) => {
            // Apply new pastel colors based on node type
            switch (type) {
                case 'start':
                case 'end': return '#000000'; // Black start/end
                case 'action': return '#bfdbfe'; // Azul claro
                case 'input': return '#fed7aa'; // Naranja claro
                case 'output': return '#bbf7d0'; // Verde claro
                case 'conditional': return '#e9d5ff'; // Violeta claro
                case 'while':
                case 'while_end': return '#fef08a'; // Amarillo claro
                case 'join': return '#4b5563'; // Gray
                default: return '#000000';
            }
        };

        const fillStyle = getFill(node.type);

        // Path shapes based on classic DFD and the provided PDF screenshots:
        // Output: Document shape (wave at bottom)
        // Input: Rhomboid / Parallelogram
        // Action: Rectangle
        // Conditional: Rhombus
        // While: Hexagon
        // Start/End: Pill shape (rounded rect)

        const createPath = (d) => {
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('d', d);
            p.setAttribute('fill', fillStyle);
            return p;
        };

        switch (node.type) {
            case 'start':
            case 'end':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shape.setAttribute('width', width);
                shape.setAttribute('height', height);
                shape.setAttribute('rx', 30);
                shape.setAttribute('fill', fillStyle);
                break;
            case 'action':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shape.setAttribute('width', width);
                shape.setAttribute('height', height);
                shape.setAttribute('fill', fillStyle);
                break;
            case 'input':
                // Parallelogram shape (Data Input)
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shape.setAttribute('points', `20,0 ${width},0 ${width - 20},${height} 0,${height}`);
                shape.setAttribute('fill', fillStyle);
                break;
            case 'output':
                // Document shape (Data Output) - wave at bottom
                // M0 0 Lw 0 Lw h-15 Q w/4 h, w/2 h-15 T 0 h Z approx
                shape = createPath(`M 0,0 L ${width},0 L ${width},${height - 10} Q ${width * 0.75},${height} ${width / 2},${height - 10} T 0,${height - 10} Z`);
                break;
            case 'conditional':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                // Rhombus shape
                shape.setAttribute('points', `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`);
                shape.setAttribute('fill', fillStyle);
                break;
            case 'while':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                // Hexagon (top half) - used for MQ start
                shape.setAttribute('points', `20,0 ${width - 20},0 ${width},${height / 2} ${width - 20},${height} 20,${height} 0,${height / 2}`);
                shape.setAttribute('fill', fillStyle);
                break;
            case 'while_end':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shape.setAttribute('width', width);
                shape.setAttribute('height', 20);
                shape.setAttribute('y', 20); // vertical offset
                shape.setAttribute('rx', 10);
                shape.setAttribute('fill', fillStyle);
                break;
            case 'join':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                shape.setAttribute('cx', width / 2);
                shape.setAttribute('cy', 30);
                shape.setAttribute('r', 10);
                shape.setAttribute('fill', fillStyle);
                break;
        }

        // Apply shared styles
        if (shape) {
            shape.setAttribute('stroke', '#ffffff33');
            shape.setAttribute('stroke-width', '2');
            shape.setAttribute('style', `fill: ${fillStyle}; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3))`);
            g.appendChild(shape);
        }

        // Label
        if (node.type !== 'join') {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width / 2);
            text.setAttribute('y', node.type === 'while_end' ? 30 : height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            // Black text for visibility on light pastels, white for start/end
            text.setAttribute('fill', (node.type === 'start' || node.type === 'end') ? 'white' : 'black');
            text.setAttribute('font-size', '14px');
            text.setAttribute('font-family', 'Inter, sans-serif');
            text.setAttribute('font-weight', '500');
            text.textContent = node.data?.label || node.type.toUpperCase();
            text.style.pointerEvents = 'none'; // prevent text selection while dragging
            g.appendChild(text);
        }

        this.nodesLayer.appendChild(g);
    }
}
