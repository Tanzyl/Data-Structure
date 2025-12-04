#include <emscripten.h>

// Include all data structure implementations
// Note: We'll compile them together, so we just need declarations here

extern "C" {
    // Heap functions
    void createHeap(int isMin);
    void heapInsert(int value);
    int heapDelete();
    void heapClear();
    int* heapGetArray();
    int heapGetSize();

    // AVL Tree functions
    void createAVLTree();
    void avlInsert(int value);
    void avlDelete(int value);
    void avlClear();

    // Graph functions
    void createGraph();
    void graphAddNode(char node);
    void graphRemoveNode(char node);
    void graphAddEdge(char from, char to, int weight);
    void graphRemoveEdge(char from, char to);
    void graphClear();
    int* graphBFS(char start, int* size);
    int* graphDFS(char start, int* size);

    // Hash Table functions
    void createHashTable(int size, int useChaining);
    void hashTableInsert(const char* key, const char* value);
    const char* hashTableSearch(const char* key);
    int hashTableDelete(const char* key);
    void hashTableClear();
}

