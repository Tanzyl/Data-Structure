#include <vector>
#include <algorithm>
#include <string>
#include <emscripten.h>

class BinaryHeap {
private:
    std::vector<int> heap;
    bool isMinHeap;

    int parent(int i) { return (i - 1) / 2; }
    int left(int i) { return 2 * i + 1; }
    int right(int i) { return 2 * i + 2; }

    void heapifyUp(int index) {
        while (index > 0) {
            int p = parent(index);
            if ((isMinHeap && heap[index] < heap[p]) || (!isMinHeap && heap[index] > heap[p])) {
                std::swap(heap[index], heap[p]);
                index = p;
            } else {
                break;
            }
        }
    }

    void heapifyDown(int index) {
        while (true) {
            int smallest = index;
            int l = left(index);
            int r = right(index);

            if (l < heap.size() && ((isMinHeap && heap[l] < heap[smallest]) || 
                                    (!isMinHeap && heap[l] > heap[smallest]))) {
                smallest = l;
            }
            if (r < heap.size() && ((isMinHeap && heap[r] < heap[smallest]) || 
                                    (!isMinHeap && heap[r] > heap[smallest]))) {
                smallest = r;
            }

            if (smallest != index) {
                std::swap(heap[index], heap[smallest]);
                index = smallest;
            } else {
                break;
            }
        }
    }

public:
    BinaryHeap(bool minHeap = true) : isMinHeap(minHeap) {}

    void insert(int value) {
        heap.push_back(value);
        heapifyUp(heap.size() - 1);
    }

    int deleteRoot() {
        if (heap.empty()) return -1;
        int root = heap[0];
        heap[0] = heap.back();
        heap.pop_back();
        if (!heap.empty()) {
            heapifyDown(0);
        }
        return root;
    }

    void clear() {
        heap.clear();
    }

    int* getArray() {
        if (heap.empty()) return nullptr;
        int* arr = new int[heap.size()];
        for (size_t i = 0; i < heap.size(); i++) {
            arr[i] = heap[i];
        }
        return arr;
    }

    int getSize() {
        return heap.size();
    }
};

static BinaryHeap* heap = nullptr;

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void createHeap(int isMin) {
        if (heap) delete heap;
        heap = new BinaryHeap(isMin == 1);
    }

    EMSCRIPTEN_KEEPALIVE
    void heapInsert(int value) {
        if (!heap) heap = new BinaryHeap(true);
        heap->insert(value);
    }

    EMSCRIPTEN_KEEPALIVE
    int heapDelete() {
        if (!heap) return -1;
        return heap->deleteRoot();
    }

    EMSCRIPTEN_KEEPALIVE
    void heapClear() {
        if (heap) heap->clear();
    }

    EMSCRIPTEN_KEEPALIVE
    int* heapGetArray() {
        if (!heap) return nullptr;
        return heap->getArray();
    }

    EMSCRIPTEN_KEEPALIVE
    int heapGetSize() {
        if (!heap) return 0;
        return heap->getSize();
    }
}

