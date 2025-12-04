#include <vector>
#include <list>
#include <string>
#include <emscripten.h>

struct KeyValue {
    char* key;
    char* value;
};

class HashTable {
private:
    int size;
    bool useChaining;
    std::vector<std::list<KeyValue>> chainingTable;
    std::vector<KeyValue*> linearTable;

    int hash(const char* key) {
        int hash = 0;
        for (int i = 0; key[i] != '\0'; i++) {
            hash = (hash * 31 + key[i]) % size;
        }
        return hash;
    }

public:
    HashTable(int tableSize = 11, bool chaining = true) : size(tableSize), useChaining(chaining) {
        if (useChaining) {
            chainingTable.resize(size);
        } else {
            linearTable.resize(size, nullptr);
        }
    }

    void insert(const char* key, const char* value) {
        int index = hash(key);
        
        if (useChaining) {
            // Check if key exists
            for (auto& item : chainingTable[index]) {
                if (std::string(item.key) == std::string(key)) {
                    delete[] item.value;
                    item.value = new char[strlen(value) + 1];
                    strcpy(item.value, value);
                    return;
                }
            }
            // Insert new
            KeyValue kv;
            kv.key = new char[strlen(key) + 1];
            kv.value = new char[strlen(value) + 1];
            strcpy(kv.key, key);
            strcpy(kv.value, value);
            chainingTable[index].push_back(kv);
        } else {
            // Linear probing
            int currentIndex = index;
            int attempts = 0;
            while (attempts < size) {
                if (linearTable[currentIndex] == nullptr) {
                    linearTable[currentIndex] = new KeyValue();
                    linearTable[currentIndex]->key = new char[strlen(key) + 1];
                    linearTable[currentIndex]->value = new char[strlen(value) + 1];
                    strcpy(linearTable[currentIndex]->key, key);
                    strcpy(linearTable[currentIndex]->value, value);
                    return;
                } else if (std::string(linearTable[currentIndex]->key) == std::string(key)) {
                    delete[] linearTable[currentIndex]->value;
                    linearTable[currentIndex]->value = new char[strlen(value) + 1];
                    strcpy(linearTable[currentIndex]->value, value);
                    return;
                }
                currentIndex = (currentIndex + 1) % size;
                attempts++;
            }
        }
    }

    const char* search(const char* key) {
        int index = hash(key);
        
        if (useChaining) {
            for (const auto& item : chainingTable[index]) {
                if (std::string(item.key) == std::string(key)) {
                    return item.value;
                }
            }
        } else {
            int currentIndex = index;
            int attempts = 0;
            while (attempts < size) {
                if (linearTable[currentIndex] == nullptr) {
                    return nullptr;
                }
                if (std::string(linearTable[currentIndex]->key) == std::string(key)) {
                    return linearTable[currentIndex]->value;
                }
                currentIndex = (currentIndex + 1) % size;
                attempts++;
            }
        }
        return nullptr;
    }

    bool remove(const char* key) {
        int index = hash(key);
        
        if (useChaining) {
            for (auto it = chainingTable[index].begin(); it != chainingTable[index].end(); ++it) {
                if (std::string(it->key) == std::string(key)) {
                    delete[] it->key;
                    delete[] it->value;
                    chainingTable[index].erase(it);
                    return true;
                }
            }
        } else {
            int currentIndex = index;
            int attempts = 0;
            while (attempts < size) {
                if (linearTable[currentIndex] == nullptr) {
                    return false;
                }
                if (std::string(linearTable[currentIndex]->key) == std::string(key)) {
                    delete[] linearTable[currentIndex]->key;
                    delete[] linearTable[currentIndex]->value;
                    delete linearTable[currentIndex];
                    linearTable[currentIndex] = nullptr;
                    return true;
                }
                currentIndex = (currentIndex + 1) % size;
                attempts++;
            }
        }
        return false;
    }

    void clear() {
        if (useChaining) {
            for (auto& bucket : chainingTable) {
                for (auto& item : bucket) {
                    delete[] item.key;
                    delete[] item.value;
                }
                bucket.clear();
            }
        } else {
            for (int i = 0; i < size; i++) {
                if (linearTable[i]) {
                    delete[] linearTable[i]->key;
                    delete[] linearTable[i]->value;
                    delete linearTable[i];
                    linearTable[i] = nullptr;
                }
            }
        }
    }

    int getSize() { return size; }
    bool isChaining() { return useChaining; }
};

static HashTable* hashTable = nullptr;

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void createHashTable(int size, int useChaining) {
        if (hashTable) delete hashTable;
        hashTable = new HashTable(size, useChaining == 1);
    }

    EMSCRIPTEN_KEEPALIVE
    void hashTableInsert(const char* key, const char* value) {
        if (!hashTable) hashTable = new HashTable(11, true);
        hashTable->insert(key, value);
    }

    EMSCRIPTEN_KEEPALIVE
    const char* hashTableSearch(const char* key) {
        if (!hashTable) return nullptr;
        return hashTable->search(key);
    }

    EMSCRIPTEN_KEEPALIVE
    int hashTableDelete(const char* key) {
        if (!hashTable) return 0;
        return hashTable->remove(key) ? 1 : 0;
    }

    EMSCRIPTEN_KEEPALIVE
    void hashTableClear() {
        if (hashTable) hashTable->clear();
    }
}

