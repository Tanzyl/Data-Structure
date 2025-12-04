#include <vector>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <climits>
#include <algorithm>
#include <emscripten.h>

class Graph {
private:
    std::set<char> nodes;
    std::map<char, std::vector<char>> edges;
    std::map<std::string, int> weights;

public:
    void addNode(char node) {
        nodes.insert(node);
        edges[node] = std::vector<char>();
    }

    void removeNode(char node) {
        nodes.erase(node);
        edges.erase(node);
        for (auto& [from, toList] : edges) {
            toList.erase(std::remove(toList.begin(), toList.end(), node), toList.end());
        }
    }

    void addEdge(char from, char to, int weight = 1) {
        if (nodes.find(from) != nodes.end() && nodes.find(to) != nodes.end()) {
            edges[from].push_back(to);
            std::string key = std::string(1, from) + "-" + std::string(1, to);
            weights[key] = weight;
        }
    }

    void removeEdge(char from, char to) {
        if (edges.find(from) != edges.end()) {
            edges[from].erase(
                std::remove(edges[from].begin(), edges[from].end(), to),
                edges[from].end()
            );
            std::string key = std::string(1, from) + "-" + std::string(1, to);
            weights.erase(key);
        }
    }

    void clear() {
        nodes.clear();
        edges.clear();
        weights.clear();
    }

    std::vector<char> bfs(char start) {
        std::vector<char> result;
        if (nodes.find(start) == nodes.end()) return result;

        std::queue<char> q;
        std::set<char> visited;
        q.push(start);
        visited.insert(start);

        while (!q.empty()) {
            char current = q.front();
            q.pop();
            result.push_back(current);

            for (char neighbor : edges[current]) {
                if (visited.find(neighbor) == visited.end()) {
                    visited.insert(neighbor);
                    q.push(neighbor);
                }
            }
        }
        return result;
    }

    std::vector<char> dfs(char start) {
        std::vector<char> result;
        if (nodes.find(start) == nodes.end()) return result;

        std::stack<char> s;
        std::set<char> visited;
        s.push(start);

        while (!s.empty()) {
            char current = s.top();
            s.pop();

            if (visited.find(current) != visited.end()) continue;
            visited.insert(current);
            result.push_back(current);

            for (auto it = edges[current].rbegin(); it != edges[current].rend(); ++it) {
                if (visited.find(*it) == visited.end()) {
                    s.push(*it);
                }
            }
        }
        return result;
    }

    std::map<char, int> dijkstra(char start) {
        std::map<char, int> distances;
        for (char node : nodes) {
            distances[node] = INT_MAX;
        }
        distances[start] = 0;

        std::vector<std::pair<int, char>> pq;
        pq.push_back({0, start});
        std::make_heap(pq.begin(), pq.end(), std::greater<std::pair<int, char>>());

        while (!pq.empty()) {
            std::pop_heap(pq.begin(), pq.end(), std::greater<std::pair<int, char>>());
            int dist = pq.back().first;
            char current = pq.back().second;
            pq.pop_back();

            if (dist > distances[current]) continue;

            for (char neighbor : edges[current]) {
                std::string key = std::string(1, current) + "-" + std::string(1, neighbor);
                int weight = (weights.find(key) != weights.end()) ? weights[key] : 1;
                int alt = distances[current] + weight;

                if (alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    pq.push_back({alt, neighbor});
                    std::push_heap(pq.begin(), pq.end(), std::greater<std::pair<int, char>>());
                }
            }
        }
        return distances;
    }

    std::vector<std::string> prim(char start) {
        std::vector<std::string> mst;
        std::set<char> inMST;
        inMST.insert(start);

        while (inMST.size() < nodes.size()) {
            int minWeight = INT_MAX;
            std::string minEdge = "";

            for (char node : inMST) {
                for (char neighbor : edges[node]) {
                    if (inMST.find(neighbor) == inMST.end()) {
                        std::string key = std::string(1, node) + "-" + std::string(1, neighbor);
                        int weight = (weights.find(key) != weights.end()) ? weights[key] : 1;
                        if (weight < minWeight) {
                            minWeight = weight;
                            minEdge = key;
                        }
                    }
                }
            }

            if (!minEdge.empty()) {
                mst.push_back(minEdge);
                inMST.insert(minEdge[2]);
            } else {
                break;
            }
        }
        return mst;
    }

    int getNodeCount() { return nodes.size(); }
};

static Graph* graph = nullptr;

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void createGraph() {
        if (graph) delete graph;
        graph = new Graph();
    }

    EMSCRIPTEN_KEEPALIVE
    void graphAddNode(char node) {
        if (!graph) graph = new Graph();
        graph->addNode(node);
    }

    EMSCRIPTEN_KEEPALIVE
    void graphRemoveNode(char node) {
        if (graph) graph->removeNode(node);
    }

    EMSCRIPTEN_KEEPALIVE
    void graphAddEdge(char from, char to, int weight) {
        if (!graph) graph = new Graph();
        graph->addEdge(from, to, weight);
    }

    EMSCRIPTEN_KEEPALIVE
    void graphRemoveEdge(char from, char to) {
        if (graph) graph->removeEdge(from, to);
    }

    EMSCRIPTEN_KEEPALIVE
    void graphClear() {
        if (graph) graph->clear();
    }

    EMSCRIPTEN_KEEPALIVE
    int* graphBFS(char start, int* size) {
        if (!graph) {
            *size = 0;
            return nullptr;
        }
        std::vector<char> result = graph->bfs(start);
        *size = result.size();
        int* arr = new int[result.size()];
        for (size_t i = 0; i < result.size(); i++) {
            arr[i] = result[i];
        }
        return arr;
    }

    EMSCRIPTEN_KEEPALIVE
    int* graphDFS(char start, int* size) {
        if (!graph) {
            *size = 0;
            return nullptr;
        }
        std::vector<char> result = graph->dfs(start);
        *size = result.size();
        int* arr = new int[result.size()];
        for (size_t i = 0; i < result.size(); i++) {
            arr[i] = result[i];
        }
        return arr;
    }
}

