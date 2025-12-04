// WebAssembly Wrapper for Data Structure Visualizer
let Module = null;
let wasmReady = false;

// WebAssembly function wrappers
let wasmFunctions = {
    // Heap functions
    createHeap: null,
    heapInsert: null,
    heapDelete: null,
    heapClear: null,
    heapGetArray: null,
    heapGetSize: null,
    
    // AVL Tree functions
    createAVLTree: null,
    avlInsert: null,
    avlDelete: null,
    avlClear: null,
    
    // Graph functions
    createGraph: null,
    graphAddNode: null,
    graphRemoveNode: null,
    graphAddEdge: null,
    graphRemoveEdge: null,
    graphClear: null,
    graphBFS: null,
    graphDFS: null,
    
    // Hash Table functions
    createHashTable: null,
    hashTableInsert: null,
    hashTableSearch: null,
    hashTableDelete: null,
    hashTableClear: null,
    
    // Memory management
    malloc: null,
    free: null,
    UTF8ToString: null,
    stringToUTF8: null
};

// Initialize WebAssembly module
function initWasm() {
    return new Promise((resolve, reject) => {
        if (typeof Module === 'undefined') {
            Module = {
                onRuntimeInitialized: function() {
                    // Create function wrappers
                    wasmFunctions.createHeap = Module.cwrap('createHeap', null, ['number']);
                    wasmFunctions.heapInsert = Module.cwrap('heapInsert', null, ['number']);
                    wasmFunctions.heapDelete = Module.cwrap('heapDelete', 'number', []);
                    wasmFunctions.heapClear = Module.cwrap('heapClear', null, []);
                    wasmFunctions.heapGetArray = Module.cwrap('heapGetArray', 'number', []);
                    wasmFunctions.heapGetSize = Module.cwrap('heapGetSize', 'number', []);
                    
                    wasmFunctions.createAVLTree = Module.cwrap('createAVLTree', null, []);
                    wasmFunctions.avlInsert = Module.cwrap('avlInsert', null, ['number']);
                    wasmFunctions.avlDelete = Module.cwrap('avlDelete', null, ['number']);
                    wasmFunctions.avlClear = Module.cwrap('avlClear', null, []);
                    
                    wasmFunctions.createGraph = Module.cwrap('createGraph', null, []);
                    wasmFunctions.graphAddNode = Module.cwrap('graphAddNode', null, ['number']);
                    wasmFunctions.graphRemoveNode = Module.cwrap('graphRemoveNode', null, ['number']);
                    wasmFunctions.graphAddEdge = Module.cwrap('graphAddEdge', null, ['number', 'number', 'number']);
                    wasmFunctions.graphRemoveEdge = Module.cwrap('graphRemoveEdge', null, ['number', 'number']);
                    wasmFunctions.graphClear = Module.cwrap('graphClear', null, []);
                    wasmFunctions.graphBFS = Module.cwrap('graphBFS', 'number', ['number', 'number']);
                    wasmFunctions.graphDFS = Module.cwrap('graphDFS', 'number', ['number', 'number']);
                    
                    wasmFunctions.createHashTable = Module.cwrap('createHashTable', null, ['number', 'number']);
                    wasmFunctions.hashTableInsert = Module.cwrap('hashTableInsert', null, ['string', 'string']);
                    wasmFunctions.hashTableSearch = Module.cwrap('hashTableSearch', 'string', ['string']);
                    wasmFunctions.hashTableDelete = Module.cwrap('hashTableDelete', 'number', ['string']);
                    wasmFunctions.hashTableClear = Module.cwrap('hashTableClear', null, []);
                    
                    wasmFunctions.malloc = Module.cwrap('malloc', 'number', ['number']);
                    wasmFunctions.free = Module.cwrap('free', null, ['number']);
                    wasmFunctions.UTF8ToString = Module.UTF8ToString;
                    wasmFunctions.stringToUTF8 = Module.stringToUTF8;
                    
                    wasmReady = true;
                    console.log('WebAssembly module initialized');
                    resolve();
                }
            };
            
            // Load the WebAssembly module
            const script = document.createElement('script');
            script.src = 'ds_visualizer.js';
            script.onload = () => {
                console.log('WebAssembly script loaded');
            };
            script.onerror = (error) => {
                console.error('Failed to load WebAssembly:', error);
                reject(error);
            };
            document.head.appendChild(script);
        } else {
            resolve();
        }
    });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWasm);
} else {
    initWasm();
}

