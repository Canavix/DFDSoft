export class Diagram {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.idCounter = 1;
        this.history = [];
        this.historyIndex = -1;

        // Initialize with Start and End nodes
        this.initDefaultFlow();
    }

    initDefaultFlow() {
        const startNode = {
            id: 'node_start',
            type: 'start',
            x: window.innerWidth / 2 - 100,
            y: 50,
            data: { label: 'Inicio' }
        };

        const endNode = {
            id: 'node_end',
            type: 'end',
            x: window.innerWidth / 2 - 100,
            y: 300,
            data: { label: 'Fin' }
        };

        this.nodes = [startNode, endNode];
        this.connections = [
            { source: 'node_start', target: 'node_end', type: 'main' }
        ];
        this.saveState();
    }

    saveState() {
        // Discard future history if we are in the middle of undo stack
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push({
            nodes: JSON.parse(JSON.stringify(this.nodes)),
            connections: JSON.parse(JSON.stringify(this.connections)),
            idCounter: this.idCounter
        });

        // Cap history at 50 steps
        if (this.history.length > 50) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        window.dispatchEvent(new CustomEvent('history-changed'));
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
        }
    }

    restoreState(state) {
        this.nodes = JSON.parse(JSON.stringify(state.nodes));
        this.connections = JSON.parse(JSON.stringify(state.connections));
        this.idCounter = state.idCounter;
        this.autoLayout();
        window.dispatchEvent(new CustomEvent('history-changed'));
    }

    addNode(type, x, y, explicitConn = null) {
        // Adjust center (kept for initial manual placement if needed, though layout overrides)
        x = x - 60;
        y = y - 30;

        const id = `node_${this.idCounter++}`;
        const node = {
            id,
            type,
            x: 0,
            y: 0,
            data: this.getDefaultData(type)
        };

        let targetConn = explicitConn;

        if (targetConn) {
            // Split connection
            this.connections = this.connections.filter(c => c !== targetConn);

            if (type === 'conditional') {
                const joinId = `node_${this.idCounter++}`;
                const joinNode = {
                    id: joinId, type: 'join', x: 0, y: 0, data: { label: '' }
                };
                this.nodes.push(node, joinNode);

                // Route: targetConn.source -> node
                this.connections.push({ source: targetConn.source, target: id, type: targetConn.type || 'main' });
                // Route: node -> SI -> join
                this.connections.push({ source: id, target: joinId, type: 'true' });
                // Route: node -> NO -> join
                this.connections.push({ source: id, target: joinId, type: 'false' });
                // Route: join -> targetConn.target
                this.connections.push({ source: joinId, target: targetConn.target, type: 'main' });
            } else if (type === 'while') {
                const closeId = `node_${this.idCounter++}`;
                const closeNode = {
                    id: closeId, type: 'while_end', x: 0, y: 0, data: { label: 'Fin MQ' }
                };
                node.data.closedId = closeId;
                this.nodes.push(node, closeNode);

                this.connections.push({ source: targetConn.source, target: id, type: targetConn.type || 'main' });
                // True path goes from start of while to end of while (empty inside initially)
                this.connections.push({ source: id, target: closeId, type: 'true' });
                // False path skips the while block entirely
                this.connections.push({ source: id, target: targetConn.target, type: 'false' });
                // Loop back
                this.connections.push({ source: closeId, target: id, type: 'loop' });
            } else {
                this.nodes.push(node);
                this.connections.push({ source: targetConn.source, target: id, type: targetConn.type || 'main' });
                this.connections.push({ source: id, target: targetConn.target, type: 'main' });
            }
        } else {
            return null;
        }

        this.autoLayout();
        this.saveState();
        return node;
    }

    findClosestConnection(px, py) {
        let closest = null;
        let minDist = 30; // 30px snap threshold

        for (let conn of this.connections) {
            if (conn.type === 'loop') continue; // Don't split loops

            const source = this.nodes.find(n => n.id === conn.source);
            const target = this.nodes.find(n => n.id === conn.target);
            if (!source || !target) continue;

            const sx = source.x + 60, sy = source.y + 60;
            const tx = target.x + 60, ty = target.y;

            const dist = this.distToSegmentSquared({ x: px, y: py }, { x: sx, y: sy }, { x: tx, y: ty });
            if (Math.sqrt(dist) < minDist) {
                minDist = Math.sqrt(dist);
                closest = conn;
            }
        }
        return closest;
    }

    distToSegmentSquared(p, v, w) {
        const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
        if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
    }

    autoLayout() {
        // Enforce a strict vertical / tree layout mapping starting from node_start
        const nodeWidth = 160; // Base horizontal spacing between branches
        const nodeHeight = 120; // Increased spacing (approx 1cm+ block)

        // Pass 1: Calculate the width required by each subtree to prevent crossing
        const widthReq = {};
        const calcWidth = (id) => {
            if (widthReq[id] !== undefined) return widthReq[id];
            const node = this.nodes.find(n => n.id === id);
            if (!node) return 0;

            const outgoing = this.connections.filter(c => c.source === id && c.type !== 'loop');

            if (outgoing.length === 0) {
                widthReq[id] = nodeWidth;
            } else if (outgoing.length === 1) {
                widthReq[id] = calcWidth(outgoing[0].target);
            } else if (outgoing.length === 2 && node.type === 'conditional') {
                const cFalse = outgoing.find(c => c.type === 'false');
                const cTrue = outgoing.find(c => c.type === 'true');
                const wF = cFalse ? calcWidth(cFalse.target) : nodeWidth;
                const wT = cTrue ? calcWidth(cTrue.target) : nodeWidth;
                widthReq[id] = wF + wT;
            } else if (outgoing.length === 2 && node.type === 'while') {
                // While loop doesn't split horizontally like conditional, it just drops down
                widthReq[id] = nodeWidth;
                const cTrue = outgoing.find(c => c.type === 'true');
                const cFalse = outgoing.find(c => c.type === 'false');
                if (cTrue) calcWidth(cTrue.target);
                if (cFalse) calcWidth(cFalse.target);
            } else {
                widthReq[id] = nodeWidth;
            }
            return widthReq[id];
        };

        if (this.nodes.length > 0) calcWidth('node_start');

        const setPos = (id, x, y) => {
            const n = this.nodes.find(node => node.id === id);
            if (n) { n.x = x; n.y = y; }
        };

        const visited = new Set();

        // Pass 2: Place nodes using the calculated width requirements to center them
        const layoutNode = (id, xCenter, y) => {
            if (visited.has(id)) return y;
            visited.add(id);

            setPos(id, xCenter, y);
            const node = this.nodes.find(n => n.id === id);

            const outgoing = this.connections.filter(c => c.source === id && c.type !== 'loop');

            if (outgoing.length === 1) {
                return layoutNode(outgoing[0].target, xCenter, y + nodeHeight);
            } else if (outgoing.length === 2 && node.type === 'conditional') {
                // branch left (NO) and right (SI)
                const cFalse = outgoing.find(c => c.type === 'false');
                const cTrue = outgoing.find(c => c.type === 'true');

                const wF = cFalse ? widthReq[cFalse.target] : nodeWidth;
                const wT = cTrue ? widthReq[cTrue.target] : nodeWidth;

                // Total width is wF + wT. The dividing line is offset from left by wF.
                // Left center = xCenter - (wT / 2) ? No. 
                // Left subtree sits in [xCenter - wF, xCenter]. Its center is xCenter - wF/2
                // Right subtree sits in [xCenter, xCenter + wT]. Its center is xCenter + wT/2

                // Find the corresponding join node so we don't accidentally lay it out inside the branches
                const joinConn = this.getBranchTailConnection(id, 'true');
                const joinId = joinConn ? joinConn.target : null;

                if (joinId) visited.add(joinId); // block premature traversal

                let yMax = y;

                if (cFalse) {
                    const y1 = layoutNode(cFalse.target, xCenter - (wF / 2), y + nodeHeight);
                    if (y1 > yMax) yMax = y1;
                }

                if (cTrue) {
                    const y2 = layoutNode(cTrue.target, xCenter + (wT / 2), y + nodeHeight);
                    if (y2 > yMax) yMax = y2;
                }

                if (joinId) {
                    visited.delete(joinId); // unblock
                    return layoutNode(joinId, xCenter, yMax + nodeHeight);
                }

                return yMax;
            } else if (outgoing.length === 2 && node.type === 'while') {
                const cTrue = outgoing.find(c => c.type === 'true'); // body
                const cFalse = outgoing.find(c => c.type === 'false'); // exit

                let yMax = y;
                if (cTrue) {
                    yMax = layoutNode(cTrue.target, xCenter, y + nodeHeight);
                }
                if (cFalse) {
                    // Place exit below the while body
                    yMax = layoutNode(cFalse.target, xCenter, yMax + nodeHeight);
                }
                return yMax;
            }
            return y;
        };

        layoutNode('node_start', window.innerWidth / 2 - 60, 50);
    }

    getDefaultData(type) {
        switch (type) {
            case 'output': return { text: '"Hola Mundo"' };
            case 'input': return { variable: '' };
            case 'action': return { target: '', operand1: '', operator: '+', operand2: '' };
            case 'conditional': return { operand1: '', operator: '=', operand2: '' };
            case 'while': return { operand1: '', operator: '=', operand2: '', closedId: null };
            default: return {};
        }
    }

    getBranchTailConnection(condId, branchType) {
        // Traverse the branch (branchType = 'true' or 'false') starting from the conditional node
        // until we find the connection that feeds into the 'join' node of this conditional.
        let currentConn = this.connections.find(c => c.source === condId && c.type === branchType);
        if (!currentConn) return null;

        while (currentConn) {
            const targetNode = this.nodes.find(n => n.id === currentConn.target);
            if (targetNode && targetNode.type === 'join') {
                return currentConn;
            }

            // Move down the chain
            const nextConn = this.connections.find(c => c.source === targetNode.id && c.type !== 'loop');
            if (!nextConn) break;
            currentConn = nextConn;
        }
        return currentConn;
    }

    deleteNode(id) {
        if (id === 'node_start' || id === 'node_end') return; // Cannot delete start/end

        const node = this.nodes.find(n => n.id === id);
        if (!node) return;

        // Collect items to remove
        const deleteIds = [id];

        if (node.type === 'while') {
            if (node.data.closedId) deleteIds.push(node.data.closedId);
        } else if (node.type === 'while_end') {
            const whileNode = this.nodes.find(n => n.type === 'while' && n.data.closedId === id);
            if (whileNode) deleteIds.push(whileNode.id);
        } else if (node.type === 'conditional') {
            const truePath = this.connections.find(c => c.source === id && c.type === 'true');
            if (truePath && truePath.target.startsWith('node_')) {
                const joinNode = this.nodes.find(n => n.id === truePath.target && n.type === 'join');
                if (joinNode) deleteIds.push(joinNode.id);
            }
        } else if (node.type === 'join') {
            const inc = this.connections.find(c => c.target === id);
            if (inc) {
                const condNode = this.nodes.find(n => n.id === inc.source && n.type === 'conditional');
                if (condNode) deleteIds.push(condNode.id);
            }
        }

        // Before removing, find the "global" ingress and egress of this group to preserve the flow:
        // By finding all connections coming from outside into deleteIds, and from deleteIds to outside
        const incoming = this.connections.filter(c => !deleteIds.includes(c.source) && deleteIds.includes(c.target));
        const outgoing = this.connections.filter(c => deleteIds.includes(c.source) && !deleteIds.includes(c.target) && (c.type === 'main' || c.type === 'false'));

        // Execute removals
        this.nodes = this.nodes.filter(n => !deleteIds.includes(n.id));
        this.connections = this.connections.filter(c => !deleteIds.includes(c.source) && !deleteIds.includes(c.target));

        // Reconnect flow
        if (incoming.length > 0 && outgoing.length > 0) {
            this.connections.push({
                source: incoming[0].source,
                target: outgoing[0].target,
                type: incoming[0].type
            });
        }

        this.autoLayout();
        this.saveState();
    }

    updateNodePosition(id, x, y) {
        const node = this.nodes.find(n => n.id === id);
        if (node) {
            node.x = x;
            node.y = y;
        }
    }
}
