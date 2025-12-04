#include <algorithm>
#include <emscripten.h>

struct AVLNode {
    int value;
    AVLNode* left;
    AVLNode* right;
    int height;

    AVLNode(int val) : value(val), left(nullptr), right(nullptr), height(1) {}
};

class AVLTree {
private:
    AVLNode* root;

    int getHeight(AVLNode* node) {
        return node ? node->height : 0;
    }

    int getBalance(AVLNode* node) {
        return node ? getHeight(node->left) - getHeight(node->right) : 0;
    }

    void updateHeight(AVLNode* node) {
        node->height = 1 + std::max(getHeight(node->left), getHeight(node->right));
    }

    AVLNode* rotateRight(AVLNode* y) {
        AVLNode* x = y->left;
        AVLNode* T2 = x->right;

        x->right = y;
        y->left = T2;

        updateHeight(y);
        updateHeight(x);

        return x;
    }

    AVLNode* rotateLeft(AVLNode* x) {
        AVLNode* y = x->right;
        AVLNode* T2 = y->left;

        y->left = x;
        x->right = T2;

        updateHeight(x);
        updateHeight(y);

        return y;
    }

    AVLNode* insert(AVLNode* node, int value) {
        if (!node) return new AVLNode(value);

        if (value < node->value) {
            node->left = insert(node->left, value);
        } else if (value > node->value) {
            node->right = insert(node->right, value);
        } else {
            return node; // Duplicate values not allowed
        }

        updateHeight(node);
        int balance = getBalance(node);

        // Left Left
        if (balance > 1 && value < node->left->value) {
            return rotateRight(node);
        }

        // Right Right
        if (balance < -1 && value > node->right->value) {
            return rotateLeft(node);
        }

        // Left Right
        if (balance > 1 && value > node->left->value) {
            node->left = rotateLeft(node->left);
            return rotateRight(node);
        }

        // Right Left
        if (balance < -1 && value < node->right->value) {
            node->right = rotateRight(node->right);
            return rotateLeft(node);
        }

        return node;
    }

    AVLNode* getMinNode(AVLNode* node) {
        while (node->left) node = node->left;
        return node;
    }

    AVLNode* deleteNode(AVLNode* node, int value) {
        if (!node) return nullptr;

        if (value < node->value) {
            node->left = deleteNode(node->left, value);
        } else if (value > node->value) {
            node->right = deleteNode(node->right, value);
        } else {
            if (!node->left) {
                AVLNode* temp = node->right;
                delete node;
                return temp;
            }
            if (!node->right) {
                AVLNode* temp = node->left;
                delete node;
                return temp;
            }

            AVLNode* minNode = getMinNode(node->right);
            node->value = minNode->value;
            node->right = deleteNode(node->right, minNode->value);
        }

        updateHeight(node);
        int balance = getBalance(node);

        // Left Left
        if (balance > 1 && getBalance(node->left) >= 0) {
            return rotateRight(node);
        }

        // Left Right
        if (balance > 1 && getBalance(node->left) < 0) {
            node->left = rotateLeft(node->left);
            return rotateRight(node);
        }

        // Right Right
        if (balance < -1 && getBalance(node->right) <= 0) {
            return rotateLeft(node);
        }

        // Right Left
        if (balance < -1 && getBalance(node->right) > 0) {
            node->right = rotateRight(node->right);
            return rotateLeft(node);
        }

        return node;
    }

    void clearTree(AVLNode* node) {
        if (node) {
            clearTree(node->left);
            clearTree(node->right);
            delete node;
        }
    }

public:
    AVLTree() : root(nullptr) {}

    void insert(int value) {
        root = insert(root, value);
    }

    void deleteNode(int value) {
        root = deleteNode(root, value);
    }

    void clear() {
        clearTree(root);
        root = nullptr;
    }

    AVLNode* getRoot() {
        return root;
    }
};

static AVLTree* avlTree = nullptr;

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void createAVLTree() {
        if (avlTree) delete avlTree;
        avlTree = new AVLTree();
    }

    EMSCRIPTEN_KEEPALIVE
    void avlInsert(int value) {
        if (!avlTree) avlTree = new AVLTree();
        avlTree->insert(value);
    }

    EMSCRIPTEN_KEEPALIVE
    void avlDelete(int value) {
        if (avlTree) avlTree->deleteNode(value);
    }

    EMSCRIPTEN_KEEPALIVE
    void avlClear() {
        if (avlTree) avlTree->clear();
    }
}

