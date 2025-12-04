// ==================== Global Variables ====================
let animationSpeed = 500;
let currentAnimation = null;
let wasmReady = false;

// Wait for WebAssembly to be ready
function waitForWasm(callback) {
    if (typeof Module !== 'undefined' && Module && Module.asm) {
        wasmReady = true;
        if (callback) callback();
    } else {
        setTimeout(() => waitForWasm(callback), 100);
    }
}

// ==================== Logging System ====================
function log(message, type = 'info') {
    const logContent = document.getElementById('log-content');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

document.getElementById('log-clear').addEventListener('click', () => {
    document.getElementById('log-content').innerHTML = '';
});

// ==================== Tab Switching ====================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        
        // Resize canvases when switching tabs
        setTimeout(() => {
            resizeCanvases();
        }, 100);
    });
});

function resizeCanvases() {
    const canvases = ['heap-canvas', 'avl-canvas', 'graph-canvas', 'ht-canvas'];
    canvases.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) {
            const container = canvas.parentElement;
            canvas.width = container.clientWidth - 40;
            canvas.height = Math.max(500, container.clientHeight - 40);
        }
    });
}

window.addEventListener('resize', resizeCanvases);
setTimeout(resizeCanvases, 100);

// ==================== Binary Heap (WebAssembly) ====================
class BinaryHeap {
    constructor(type = 'min') {
        this.type = type;
        this.useWasm = false;
        this.heap = []; // Always keep JS fallback
        
        // Try to use WebAssembly if available
        waitForWasm(() => {
            if (typeof Module !== 'undefined' && Module && Module._createHeap) {
                this.useWasm = true;
                Module._createHeap(type === 'min' ? 1 : 0);
                log('Using WebAssembly for Binary Heap', 'info');
            }
        });
    }

    insert(value) {
        if (this.useWasm && Module && Module._heapInsert) {
            Module._heapInsert(value);
            log(`Inserted ${value} into ${this.type} heap (WASM)`, 'success');
        } else {
            // JavaScript fallback
            this.heap.push(value);
            this.heapifyUp(this.heap.length - 1);
            log(`Inserted ${value} into ${this.type} heap`, 'success');
        }
    }

    delete() {
        if (this.useWasm && Module && Module._heapDelete) {
            const result = Module._heapDelete();
            if (result === -1) {
                log('Heap is empty', 'error');
                return null;
            }
            log(`Deleted ${result} from ${this.type} heap (WASM)`, 'success');
            return result;
        } else {
            // JavaScript fallback
            if (this.heap.length === 0) {
                log('Heap is empty', 'error');
                return null;
            }
            const root = this.heap[0];
            this.heap[0] = this.heap[this.heap.length - 1];
            this.heap.pop();
            if (this.heap.length > 0) {
                this.heapifyDown(0);
            }
            log(`Deleted ${root} from ${this.type} heap`, 'success');
            return root;
        }
    }

    heapifyUp(index) {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.compare(this.heap[index], this.heap[parent])) {
                [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
                index = parent;
            } else {
                break;
            }
        }
    }

    heapifyDown(index) {
        while (true) {
            let smallest = index;
            const left = 2 * index + 1;
            const right = 2 * index + 2;

            if (left < this.heap.length && this.compare(this.heap[left], this.heap[smallest])) {
                smallest = left;
            }
            if (right < this.heap.length && this.compare(this.heap[right], this.heap[smallest])) {
                smallest = right;
            }

            if (smallest !== index) {
                [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
                index = smallest;
            } else {
                break;
            }
        }
    }

    compare(a, b) {
        return this.type === 'min' ? a < b : a > b;
    }

    clear() {
        if (this.useWasm && Module && Module._heapClear) {
            Module._heapClear();
        }
        this.heap = [];
        log('Heap cleared', 'info');
    }

    getHeapArray() {
        if (this.useWasm && Module && Module._heapGetSize && Module._heapGetArray) {
            try {
                const size = Module._heapGetSize();
                if (size === 0) return [];
                const ptr = Module._heapGetArray();
                if (!ptr) return [];
                const arr = [];
                for (let i = 0; i < size; i++) {
                    arr.push(Module.HEAP32[(ptr >> 2) + i]);
                }
                Module._free(ptr);
                return arr;
            } catch (e) {
                console.error('WASM error, using JS fallback:', e);
                return this.heap;
            }
        } else {
            return this.heap;
        }
    }
}

let heap = new BinaryHeap('min');

function drawHeap() {
    const canvas = document.getElementById('heap-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const heapArray = heap.getHeapArray();
    
    if (heapArray.length === 0) {
        ctx.font = '20px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('Heap is empty', canvas.width / 2, canvas.height / 2);
        return;
    }

    const nodeRadius = 25;
    const levelHeight = 80;
    const nodes = [];
    const positions = [];

    // Calculate positions
    function calculatePositions(index, x, y, level, width) {
        if (index >= heapArray.length) return;
        
        positions[index] = { x, y, value: heapArray[index] };
        nodes.push({ index, x, y, value: heapArray[index] });

        const leftIndex = 2 * index + 1;
        const rightIndex = 2 * index + 2;
        const childWidth = width / 2;

        if (leftIndex < heapArray.length) {
            calculatePositions(leftIndex, x - childWidth / 2, y + levelHeight, level + 1, childWidth);
        }
        if (rightIndex < heapArray.length) {
            calculatePositions(rightIndex, x + childWidth / 2, y + levelHeight, level + 1, childWidth);
        }
    }

    const startX = canvas.width / 2;
    const startY = 50;
    calculatePositions(0, startX, startY, 0, canvas.width - 100);

    // Draw edges
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    for (let i = 0; i < heapArray.length; i++) {
        const node = positions[i];
        if (!node) continue;

        const left = 2 * i + 1;
        const right = 2 * i + 2;

        if (left < heapArray.length && positions[left]) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(positions[left].x, positions[left].y);
            ctx.stroke();
        }
        if (right < heapArray.length && positions[right]) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(positions[right].x, positions[right].y);
            ctx.stroke();
        }
    }

    // Draw nodes
    for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#667eea';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.value.toString(), node.x, node.y);
    }

    // Update array display
    const arrayDiv = document.getElementById('heap-array');
    arrayDiv.innerHTML = '';
    heapArray.forEach((val, idx) => {
        const item = document.createElement('div');
        item.className = 'array-item';
        item.textContent = val;
        arrayDiv.appendChild(item);
    });
}

// Heap event listeners
document.getElementById('heap-insert').addEventListener('click', () => {
    const value = parseInt(document.getElementById('heap-value').value);
    if (isNaN(value)) {
        log('Please enter a valid number', 'error');
        return;
    }
    heap.insert(value);
    drawHeap();
    document.getElementById('heap-value').value = '';
});

document.getElementById('heap-delete').addEventListener('click', () => {
    heap.delete();
    drawHeap();
});

document.getElementById('heap-clear').addEventListener('click', () => {
    heap.clear();
    drawHeap();
});

document.getElementById('heap-type').addEventListener('change', (e) => {
    const oldHeap = heap.getHeapArray();
    heap = new BinaryHeap(e.target.value);
    oldHeap.forEach(val => heap.insert(val));
    drawHeap();
    log(`Switched to ${e.target.value} heap`, 'info');
});

// ==================== AVL Tree ====================
class AVLNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
    }

    getHeight(node) {
        return node ? node.height : 0;
    }

    getBalance(node) {
        return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
    }

    updateHeight(node) {
        node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    }

    rotateRight(y) {
        const x = y.left;
        const T2 = x.right;

        x.right = y;
        y.left = T2;

        this.updateHeight(y);
        this.updateHeight(x);

        log(`RR Rotation performed at node ${y.value}`, 'info');
        return x;
    }

    rotateLeft(x) {
        const y = x.right;
        const T2 = y.left;

        y.left = x;
        x.right = T2;

        this.updateHeight(x);
        this.updateHeight(y);

        log(`LL Rotation performed at node ${x.value}`, 'info');
        return y;
    }

    insert(value) {
        this.root = this._insert(this.root, value);
        log(`Inserted ${value} into AVL tree`, 'success');
    }

    _insert(node, value) {
        if (!node) return new AVLNode(value);

        if (value < node.value) {
            node.left = this._insert(node.left, value);
        } else if (value > node.value) {
            node.right = this._insert(node.right, value);
        } else {
            log(`Value ${value} already exists`, 'error');
            return node;
        }

        this.updateHeight(node);
        const balance = this.getBalance(node);

        // Left Left
        if (balance > 1 && value < node.left.value) {
            return this.rotateRight(node);
        }

        // Right Right
        if (balance < -1 && value > node.right.value) {
            return this.rotateLeft(node);
        }

        // Left Right
        if (balance > 1 && value > node.left.value) {
            node.left = this.rotateLeft(node.left);
            log(`LR Rotation performed at node ${node.value}`, 'info');
            return this.rotateRight(node);
        }

        // Right Left
        if (balance < -1 && value < node.right.value) {
            node.right = this.rotateRight(node.right);
            log(`RL Rotation performed at node ${node.value}`, 'info');
            return this.rotateLeft(node);
        }

        return node;
    }

    delete(value) {
        this.root = this._delete(this.root, value);
        log(`Deleted ${value} from AVL tree`, 'success');
    }

    _delete(node, value) {
        if (!node) return null;

        if (value < node.value) {
            node.left = this._delete(node.left, value);
        } else if (value > node.value) {
            node.right = this._delete(node.right, value);
        } else {
            if (!node.left) return node.right;
            if (!node.right) return node.left;

            const minNode = this.getMinNode(node.right);
            node.value = minNode.value;
            node.right = this._delete(node.right, minNode.value);
        }

        this.updateHeight(node);
        const balance = this.getBalance(node);

        // Left Left
        if (balance > 1 && this.getBalance(node.left) >= 0) {
            return this.rotateRight(node);
        }

        // Left Right
        if (balance > 1 && this.getBalance(node.left) < 0) {
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }

        // Right Right
        if (balance < -1 && this.getBalance(node.right) <= 0) {
            return this.rotateLeft(node);
        }

        // Right Left
        if (balance < -1 && this.getBalance(node.right) > 0) {
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }

        return node;
    }

    getMinNode(node) {
        while (node.left) node = node.left;
        return node;
    }

    clear() {
        this.root = null;
        log('AVL tree cleared', 'info');
    }
}

let avlTree = new AVLTree();

function drawAVLTree() {
    const canvas = document.getElementById('avl-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!avlTree.root) {
        ctx.font = '20px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('AVL Tree is empty', canvas.width / 2, canvas.height / 2);
        return;
    }

    const nodeRadius = 25;
    const levelHeight = 80;
    const positions = new Map();

    function calculatePositions(node, x, y, level, width) {
        if (!node) return;

        positions.set(node, { x, y, value: node.value, balance: avlTree.getBalance(node), height: node.height });

        const leftWidth = node.left ? width / 2 : 0;
        const rightWidth = node.right ? width / 2 : 0;

        if (node.left) {
            calculatePositions(node.left, x - width / 4, y + levelHeight, level + 1, leftWidth);
        }
        if (node.right) {
            calculatePositions(node.right, x + width / 4, y + levelHeight, level + 1, rightWidth);
        }
    }

    calculatePositions(avlTree.root, canvas.width / 2, 50, 0, canvas.width - 100);

    // Draw edges
    function drawEdges(node) {
        if (!node) return;
        const pos = positions.get(node);

        if (node.left && positions.has(node.left)) {
            const leftPos = positions.get(node.left);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(leftPos.x, leftPos.y);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
            drawEdges(node.left);
        }

        if (node.right && positions.has(node.right)) {
            const rightPos = positions.get(node.right);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(rightPos.x, rightPos.y);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
            drawEdges(node.right);
        }
    }

    drawEdges(avlTree.root);

    // Draw nodes
    for (const [node, pos] of positions) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#667eea';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pos.value.toString(), pos.x, pos.y - 5);

        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.fillText(`H:${pos.height}`, pos.x - 15, pos.y + 15);
        ctx.fillText(`B:${pos.balance}`, pos.x + 15, pos.y + 15);
    }
}

// AVL event listeners
document.getElementById('avl-insert').addEventListener('click', () => {
    const value = parseInt(document.getElementById('avl-value').value);
    if (isNaN(value)) {
        log('Please enter a valid number', 'error');
        return;
    }
    avlTree.insert(value);
    drawAVLTree();
    document.getElementById('avl-value').value = '';
});

document.getElementById('avl-delete').addEventListener('click', () => {
    const value = parseInt(document.getElementById('avl-value').value);
    if (isNaN(value)) {
        log('Please enter a valid number', 'error');
        return;
    }
    avlTree.delete(value);
    drawAVLTree();
    document.getElementById('avl-value').value = '';
});

document.getElementById('avl-clear').addEventListener('click', () => {
    avlTree.clear();
    drawAVLTree();
});

// ==================== Graph ====================
class Graph {
    constructor() {
        this.nodes = new Set();
        this.edges = new Map();
        this.weights = new Map();
    }

    addNode(node) {
        if (this.nodes.has(node)) {
            log(`Node ${node} already exists`, 'error');
            return;
        }
        this.nodes.add(node);
        this.edges.set(node, []);
        log(`Added node ${node}`, 'success');
    }

    removeNode(node) {
        if (!this.nodes.has(node)) {
            log(`Node ${node} does not exist`, 'error');
            return;
        }
        this.nodes.delete(node);
        this.edges.delete(node);
        this.weights.delete(node);
        
        // Remove edges to this node
        for (const [from, toList] of this.edges) {
            this.edges.set(from, toList.filter(to => to !== node));
        }
        log(`Removed node ${node}`, 'success');
    }

    addEdge(from, to, weight = 1) {
        if (!this.nodes.has(from) || !this.nodes.has(to)) {
            log('Both nodes must exist', 'error');
            return;
        }
        if (!this.edges.get(from).includes(to)) {
            this.edges.get(from).push(to);
            this.weights.set(`${from}-${to}`, weight);
            log(`Added edge ${from} → ${to} (weight: ${weight})`, 'success');
        }
    }

    removeEdge(from, to) {
        if (!this.edges.has(from)) return;
        this.edges.set(from, this.edges.get(from).filter(n => n !== to));
        this.weights.delete(`${from}-${to}`);
        log(`Removed edge ${from} → ${to}`, 'success');
    }

    clear() {
        this.nodes.clear();
        this.edges.clear();
        this.weights.clear();
        log('Graph cleared', 'info');
    }
}

let graph = new Graph();
let graphLayout = new Map();
let highlightedNodes = new Set();
let highlightedEdges = new Set();

function initializeGraphLayout() {
    const nodes = Array.from(graph.nodes);
    const centerX = 400;
    const centerY = 300;
    const radius = 150;

    nodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / nodes.length;
        graphLayout.set(node, {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        });
    });
}

function drawGraph() {
    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (graph.nodes.size === 0) {
        ctx.font = '20px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('Graph is empty', canvas.width / 2, canvas.height / 2);
        return;
    }

    initializeGraphLayout();

    // Draw edges
    for (const [from, toList] of graph.edges) {
        const fromPos = graphLayout.get(from);
        if (!fromPos) continue;

        for (const to of toList) {
            const toPos = graphLayout.get(to);
            if (!toPos) continue;

            const edgeKey = `${from}-${to}`;
            const isHighlighted = highlightedEdges.has(edgeKey);

            ctx.beginPath();
            ctx.moveTo(fromPos.x, fromPos.y);
            ctx.lineTo(toPos.x, toPos.y);
            ctx.strokeStyle = isHighlighted ? '#ff6b6b' : '#333';
            ctx.lineWidth = isHighlighted ? 3 : 2;
            ctx.stroke();

            // Draw weight
            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2;
            const weight = graph.weights.get(edgeKey) || 1;
            ctx.fillStyle = 'white';
            ctx.fillRect(midX - 15, midY - 10, 30, 20);
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(weight.toString(), midX, midY + 4);
        }
    }

    // Draw nodes
    for (const node of graph.nodes) {
        const pos = graphLayout.get(node);
        if (!pos) continue;

        const isHighlighted = highlightedNodes.has(node);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
        ctx.fillStyle = isHighlighted ? '#ff6b6b' : '#667eea';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node, pos.x, pos.y);
    }
}

// Graph algorithms
async function bfs(start) {
    if (!graph.nodes.has(start)) {
        log(`Node ${start} does not exist`, 'error');
        return;
    }

    const queue = [start];
    const visited = new Set([start]);
    const queueDisplay = document.getElementById('graph-queue-stack');
    highlightedNodes.clear();
    highlightedEdges.clear();

    log(`Starting BFS from node ${start}`, 'info');

    while (queue.length > 0) {
        const current = queue.shift();
        highlightedNodes.add(current);
        drawGraph();
        queueDisplay.textContent = `Queue: [${queue.join(', ')}]`;
        log(`Visiting node ${current}`, 'info');

        await sleep(animationSpeed);

        const neighbors = graph.edges.get(current) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
                highlightedEdges.add(`${current}-${neighbor}`);
                log(`Discovered node ${neighbor}`, 'info');
            }
        }

        await sleep(animationSpeed);
    }

    log('BFS completed', 'success');
    queueDisplay.textContent = 'Queue: []';
}

async function dfs(start) {
    if (!graph.nodes.has(start)) {
        log(`Node ${start} does not exist`, 'error');
        return;
    }

    const stack = [start];
    const visited = new Set();
    const stackDisplay = document.getElementById('graph-queue-stack');
    highlightedNodes.clear();
    highlightedEdges.clear();

    log(`Starting DFS from node ${start}`, 'info');

    while (stack.length > 0) {
        const current = stack.pop();
        
        if (visited.has(current)) continue;

        visited.add(current);
        highlightedNodes.add(current);
        drawGraph();
        stackDisplay.textContent = `Stack: [${stack.join(', ')}]`;
        log(`Visiting node ${current}`, 'info');

        await sleep(animationSpeed);

        const neighbors = graph.edges.get(current) || [];
        for (let i = neighbors.length - 1; i >= 0; i--) {
            const neighbor = neighbors[i];
            if (!visited.has(neighbor)) {
                stack.push(neighbor);
                highlightedEdges.add(`${current}-${neighbor}`);
            }
        }

        await sleep(animationSpeed);
    }

    log('DFS completed', 'success');
    stackDisplay.textContent = 'Stack: []';
}

async function dijkstra(start) {
    if (!graph.nodes.has(start)) {
        log(`Node ${start} does not exist`, 'error');
        return;
    }

    const distances = new Map();
    const prev = new Map();
    const pq = [];
    const distancesDisplay = document.getElementById('graph-distances');
    highlightedNodes.clear();
    highlightedEdges.clear();

    for (const node of graph.nodes) {
        distances.set(node, Infinity);
    }
    distances.set(start, 0);
    pq.push({ node: start, dist: 0 });

    log(`Starting Dijkstra's algorithm from node ${start}`, 'info');

    while (pq.length > 0) {
        pq.sort((a, b) => a.dist - b.dist);
        const { node: current, dist } = pq.shift();

        if (dist > distances.get(current)) continue;

        highlightedNodes.add(current);
        drawGraph();
        updateDistancesDisplay(distances, distancesDisplay);
        log(`Processing node ${current} (distance: ${distances.get(current)})`, 'info');

        await sleep(animationSpeed);

        const neighbors = graph.edges.get(current) || [];
        for (const neighbor of neighbors) {
            const edgeKey = `${current}-${neighbor}`;
            const weight = graph.weights.get(edgeKey) || 1;
            const alt = distances.get(current) + weight;

            if (alt < distances.get(neighbor)) {
                distances.set(neighbor, alt);
                prev.set(neighbor, current);
                pq.push({ node: neighbor, dist: alt });
                highlightedEdges.add(edgeKey);
                log(`Relaxed edge ${current} → ${neighbor}: distance updated to ${alt}`, 'info');
            }
        }

        await sleep(animationSpeed);
    }

    log('Dijkstra\'s algorithm completed', 'success');
}

function updateDistancesDisplay(distances, display) {
    let text = 'Distances:\n';
    for (const [node, dist] of distances) {
        text += `${node}: ${dist === Infinity ? '∞' : dist}\n`;
    }
    display.textContent = text;
}

async function prim(start) {
    if (!graph.nodes.has(start)) {
        log(`Node ${start} does not exist`, 'error');
        return;
    }

    const mst = new Set();
    const inMST = new Set([start]);
    const edges = [];
    highlightedNodes.clear();
    highlightedEdges.clear();

    log(`Starting Prim's algorithm from node ${start}`, 'info');

    while (inMST.size < graph.nodes.size) {
        let minEdge = null;
        let minWeight = Infinity;

        for (const node of inMST) {
            const neighbors = graph.edges.get(node) || [];
            for (const neighbor of neighbors) {
                if (!inMST.has(neighbor)) {
                    const edgeKey = `${node}-${neighbor}`;
                    const weight = graph.weights.get(edgeKey) || 1;
                    if (weight < minWeight) {
                        minWeight = weight;
                        minEdge = { from: node, to: neighbor, weight };
                    }
                }
            }
        }

        if (minEdge) {
            inMST.add(minEdge.to);
            highlightedNodes.add(minEdge.to);
            highlightedEdges.add(`${minEdge.from}-${minEdge.to}`);
            mst.add(`${minEdge.from}-${minEdge.to}`);
            log(`Added edge ${minEdge.from} → ${minEdge.to} (weight: ${minEdge.weight}) to MST`, 'info');
            drawGraph();
            await sleep(animationSpeed);
        } else {
            break;
        }
    }

    log('Prim\'s algorithm completed', 'success');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Graph event listeners
document.getElementById('graph-add-node').addEventListener('click', () => {
    const node = document.getElementById('graph-node').value.toUpperCase();
    if (!node) {
        log('Please enter a node ID', 'error');
        return;
    }
    graph.addNode(node);
    drawGraph();
    document.getElementById('graph-node').value = '';
});

document.getElementById('graph-remove-node').addEventListener('click', () => {
    const node = document.getElementById('graph-node').value.toUpperCase();
    if (!node) {
        log('Please enter a node ID', 'error');
        return;
    }
    graph.removeNode(node);
    drawGraph();
    document.getElementById('graph-node').value = '';
});

document.getElementById('graph-add-edge').addEventListener('click', () => {
    const from = document.getElementById('graph-from').value.toUpperCase();
    const to = document.getElementById('graph-to').value.toUpperCase();
    const weight = parseInt(document.getElementById('graph-weight').value) || 1;
    if (!from || !to) {
        log('Please enter both from and to nodes', 'error');
        return;
    }
    graph.addEdge(from, to, weight);
    drawGraph();
    document.getElementById('graph-from').value = '';
    document.getElementById('graph-to').value = '';
});

document.getElementById('graph-remove-edge').addEventListener('click', () => {
    const from = document.getElementById('graph-from').value.toUpperCase();
    const to = document.getElementById('graph-to').value.toUpperCase();
    if (!from || !to) {
        log('Please enter both from and to nodes', 'error');
        return;
    }
    graph.removeEdge(from, to);
    drawGraph();
    document.getElementById('graph-from').value = '';
    document.getElementById('graph-to').value = '';
});

document.getElementById('graph-run').addEventListener('click', async () => {
    const algorithm = document.getElementById('graph-algorithm').value;
    const start = document.getElementById('graph-start').value.toUpperCase();
    if (!start) {
        log('Please enter a start node', 'error');
        return;
    }

    highlightedNodes.clear();
    highlightedEdges.clear();

    if (algorithm === 'bfs') {
        await bfs(start);
    } else if (algorithm === 'dfs') {
        await dfs(start);
    } else if (algorithm === 'dijkstra') {
        await dijkstra(start);
    } else if (algorithm === 'prim') {
        await prim(start);
    }
    drawGraph();
});

document.getElementById('graph-clear').addEventListener('click', () => {
    graph.clear();
    highlightedNodes.clear();
    highlightedEdges.clear();
    drawGraph();
});

// ==================== Hash Table ====================
class HashTable {
    constructor(size = 11, type = 'chaining') {
        this.size = size;
        this.type = type;
        this.table = Array(size).fill(null).map(() => type === 'chaining' ? [] : null);
    }

    hash(key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (hash * 31 + key.charCodeAt(i)) % this.size;
        }
        return hash;
    }

    insert(key, value) {
        const index = this.hash(key);
        
        if (this.type === 'chaining') {
            const bucket = this.table[index];
            const existing = bucket.findIndex(item => item.key === key);
            if (existing !== -1) {
                bucket[existing].value = value;
                log(`Updated key ${key} at index ${index}`, 'info');
            } else {
                bucket.push({ key, value });
                log(`Inserted ${key}:${value} at index ${index}`, 'success');
            }
        } else {
            let currentIndex = index;
            let attempts = 0;
            while (attempts < this.size) {
                if (this.table[currentIndex] === null || this.table[currentIndex].key === key) {
                    this.table[currentIndex] = { key, value };
                    log(`Inserted ${key}:${value} at index ${currentIndex}`, 'success');
                    return;
                }
                currentIndex = (currentIndex + 1) % this.size;
                attempts++;
            }
            log('Hash table is full', 'error');
        }
    }

    search(key) {
        const index = this.hash(key);
        
        if (this.type === 'chaining') {
            const bucket = this.table[index];
            const item = bucket.find(item => item.key === key);
            if (item) {
                log(`Found ${key}:${item.value} at index ${index}`, 'success');
                return item.value;
            } else {
                log(`Key ${key} not found`, 'error');
                return null;
            }
        } else {
            let currentIndex = index;
            let attempts = 0;
            while (attempts < this.size) {
                if (this.table[currentIndex] === null) {
                    log(`Key ${key} not found`, 'error');
                    return null;
                }
                if (this.table[currentIndex].key === key) {
                    log(`Found ${key}:${this.table[currentIndex].value} at index ${currentIndex}`, 'success');
                    return this.table[currentIndex].value;
                }
                currentIndex = (currentIndex + 1) % this.size;
                attempts++;
            }
            log(`Key ${key} not found`, 'error');
            return null;
        }
    }

    delete(key) {
        const index = this.hash(key);
        
        if (this.type === 'chaining') {
            const bucket = this.table[index];
            const itemIndex = bucket.findIndex(item => item.key === key);
            if (itemIndex !== -1) {
                bucket.splice(itemIndex, 1);
                log(`Deleted key ${key} from index ${index}`, 'success');
                return true;
            } else {
                log(`Key ${key} not found`, 'error');
                return false;
            }
        } else {
            let currentIndex = index;
            let attempts = 0;
            while (attempts < this.size) {
                if (this.table[currentIndex] === null) {
                    log(`Key ${key} not found`, 'error');
                    return false;
                }
                if (this.table[currentIndex].key === key) {
                    this.table[currentIndex] = null;
                    log(`Deleted key ${key} from index ${currentIndex}`, 'success');
                    return true;
                }
                currentIndex = (currentIndex + 1) % this.size;
                attempts++;
            }
            log(`Key ${key} not found`, 'error');
            return false;
        }
    }

    clear() {
        this.table = Array(this.size).fill(null).map(() => this.type === 'chaining' ? [] : null);
        log('Hash table cleared', 'info');
    }
}

let hashTable = new HashTable(11, 'chaining');

function drawHashTable() {
    const canvas = document.getElementById('ht-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cellWidth = 100;
    const cellHeight = 60;
    const startX = 50;
    const startY = 50;
    const spacing = 10;

    ctx.font = '14px Arial';
    ctx.textAlign = 'left';

    for (let i = 0; i < hashTable.size; i++) {
        const x = startX + (i % 5) * (cellWidth + spacing);
        const y = startY + Math.floor(i / 5) * (cellHeight + spacing);

        // Draw cell
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        // Draw index
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.fillText(`[${i}]`, x + 5, y + 20);

        // Draw content
        ctx.fillStyle = '#333';
        ctx.font = '11px Arial';
        
        if (hashTable.type === 'chaining') {
            const bucket = hashTable.table[i];
            if (bucket.length === 0) {
                ctx.fillStyle = '#999';
                ctx.fillText('empty', x + 5, y + 40);
            } else {
                let offsetY = 35;
                for (const item of bucket) {
                    ctx.fillStyle = '#667eea';
                    ctx.fillText(`${item.key}:${item.value}`, x + 5, y + offsetY);
                    offsetY += 15;
                }
            }
        } else {
            if (hashTable.table[i] === null) {
                ctx.fillStyle = '#999';
                ctx.fillText('empty', x + 5, y + 40);
            } else {
                ctx.fillStyle = '#667eea';
                ctx.fillText(`${hashTable.table[i].key}:${hashTable.table[i].value}`, x + 5, y + 40);
            }
        }
    }

    // Draw type label
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Hash Table (${hashTable.type === 'chaining' ? 'Chaining' : 'Linear Probing'})`, canvas.width / 2, 30);
}

// Hash Table event listeners
document.getElementById('ht-insert').addEventListener('click', () => {
    const key = document.getElementById('ht-key').value;
    const value = document.getElementById('ht-value').value;
    if (!key || !value) {
        log('Please enter both key and value', 'error');
        return;
    }
    hashTable.insert(key, value);
    drawHashTable();
    document.getElementById('ht-key').value = '';
    document.getElementById('ht-value').value = '';
});

document.getElementById('ht-search').addEventListener('click', () => {
    const key = document.getElementById('ht-key').value;
    if (!key) {
        log('Please enter a key', 'error');
        return;
    }
    hashTable.search(key);
    drawHashTable();
    document.getElementById('ht-key').value = '';
});

document.getElementById('ht-delete').addEventListener('click', () => {
    const key = document.getElementById('ht-key').value;
    if (!key) {
        log('Please enter a key', 'error');
        return;
    }
    hashTable.delete(key);
    drawHashTable();
    document.getElementById('ht-key').value = '';
});

document.getElementById('ht-clear').addEventListener('click', () => {
    hashTable.clear();
    drawHashTable();
});

document.getElementById('ht-type').addEventListener('change', (e) => {
    const oldData = [];
    for (let i = 0; i < hashTable.size; i++) {
        if (hashTable.type === 'chaining') {
            oldData.push(...hashTable.table[i]);
        } else {
            if (hashTable.table[i]) oldData.push(hashTable.table[i]);
        }
    }
    
    const size = parseInt(document.getElementById('ht-size').value);
    hashTable = new HashTable(size, e.target.value);
    
    oldData.forEach(item => hashTable.insert(item.key, item.value));
    drawHashTable();
    log(`Switched to ${e.target.value} collision handling`, 'info');
});

document.getElementById('ht-size').addEventListener('change', (e) => {
    const size = parseInt(e.target.value);
    if (size < 5 || size > 31) {
        log('Table size must be between 5 and 31', 'error');
        e.target.value = hashTable.size;
        return;
    }
    
    const oldData = [];
    for (let i = 0; i < hashTable.size; i++) {
        if (hashTable.type === 'chaining') {
            oldData.push(...hashTable.table[i]);
        } else {
            if (hashTable.table[i]) oldData.push(hashTable.table[i]);
        }
    }
    
    hashTable = new HashTable(size, hashTable.type);
    oldData.forEach(item => hashTable.insert(item.key, item.value));
    drawHashTable();
    log(`Hash table size changed to ${size}`, 'info');
});

// Initialize app after WebAssembly is ready
function initApp() {
    // Initialize canvases
    setTimeout(() => {
        resizeCanvases();
        drawHeap();
        drawAVLTree();
        drawGraph();
        drawHashTable();
    }, 200);
}

// Initialize immediately or wait for WASM
if (typeof Module !== 'undefined' && Module && Module.asm) {
    initApp();
} else {
    // Wait for WebAssembly
    waitForWasm(initApp);
    // Also initialize after a delay as fallback
    setTimeout(initApp, 1000);
}

