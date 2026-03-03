export class Storage {
    constructor(diagram, renderer) {
        this.diagram = diagram;
        this.renderer = renderer;
    }

    exportFile() {
        const payload = {
            version: "1.0",
            nodes: this.diagram.nodes,
            connections: this.diagram.connections
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "proyecto.dfd");
        dlAnchorElem.click();
    }

    importFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.version && data.nodes && data.connections) {
                    this.diagram.nodes = data.nodes;
                    this.diagram.connections = data.connections;

                    // Reset IDs counter to prevent collisions
                    let maxId = 0;
                    this.diagram.nodes.forEach(n => {
                        const idNum = parseInt(n.id.replace('node_', ''));
                        if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
                    });
                    this.diagram.idCounter = maxId + 1;

                    this.renderer.render();
                } else {
                    alert('El archivo .dfd no tiene un formato válido.');
                }
            } catch (err) {
                alert('No se pudo leer el archivo. Asegúrate de que sea un archivo .dfd válido.');
            }
        };
        reader.readAsText(file);

        // Reset input value so same file can be imported again if needed
        event.target.value = '';
    }

    exportImage() {
        const svg = document.getElementById('canvas');
        const nodesLayer = document.getElementById('nodes-layer');
        const bbox = nodesLayer.getBBox();

        // Save original states
        const transformLayer = document.getElementById('transform-layer');
        const originalTransform = transformLayer.getAttribute('transform');
        const originalViewBox = svg.getAttribute('viewBox');
        const originalWidth = svg.getAttribute('width');
        const originalHeight = svg.getAttribute('height');

        // Temporarily clear zoom/pan and frame exactly to contents
        if (originalTransform) transformLayer.removeAttribute('transform');

        const margin = 50;
        const exportWidth = Math.max(800, bbox.width + margin * 2);
        const exportHeight = Math.max(600, bbox.height + margin * 2);

        svg.setAttribute('viewBox', `${bbox.x - margin} ${bbox.y - margin} ${bbox.width + margin * 2} ${bbox.height + margin * 2}`);
        svg.setAttribute('width', exportWidth);
        svg.setAttribute('height', exportHeight);

        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);

        // Add name spaces.
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        // Add XML declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

        // Restore original states immediately
        if (originalTransform) transformLayer.setAttribute('transform', originalTransform);
        if (originalViewBox) svg.setAttribute('viewBox', originalViewBox);
        else svg.removeAttribute('viewBox');
        svg.setAttribute('width', originalWidth || '100%');
        svg.setAttribute('height', originalHeight || '100%');

        // Create an Image and draw to a Canvas to export as PNG
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = exportWidth;
            canvas.height = exportHeight;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = '#0f1115';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, 0, 0);

            const pngLink = document.createElement('a');
            pngLink.download = 'diagrama.png';
            pngLink.href = canvas.toDataURL('image/png');
            pngLink.click();
        };
        img.src = url;
    }
}
