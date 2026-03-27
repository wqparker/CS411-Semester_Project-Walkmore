import { Location } from './Location.js';
import { Node } from './GraphNode.js';
class TransitGraph {
    // Given source coordinates and destination coordinates, construct a graph.
    // Takes src and dst coordinates in case we need to restrict the search area.
    constructor(src,dst) {
        // Graph is represented as adjacency list.
        this.adjacencyList = {};
        // nodes will store nodes of the graph
        this.nodes = {};
        this.addStop(0,src.name, src.address, src.lat, src.lon);
        this.addStop(1,dst.name, dst.address, dst.lat, dst.lon);
        this.srcCoords = { lat: src.lat, lon: src.lon };
        this.dstCoords = { lat: dst.lat, lon: dst.lon };
    }

    // Method to add a new node
    addStop(id, name, address, lat, lon) {
        if (this.nodes[id]) return this.nodes[id]; //Prevent duplicate
        const loc = new Location(name, address, lat, lon);
        const newNode = new Node(id, loc);
        this.nodes[id] = newNode;
        this.adjacencyList[id] = []; //Will contain neighbors of the Node. 
        return newNode;
    }

    // Add Edge
    addEdge(fromId, toId, busTime, walkTime, distance) {
        if (this.adjacencyList[fromId] && this.adjacencyList[toId]) {
            const edgeData = {
                nodeId: toId,         // destination station ID
                transitTime: busTime,  // Bus/Subway transit time
                walkTime: walkTime,    // Walking Time
                distance: distance     // Distance
            };
        this.adjacencyList[fromId].push(edgeData);
        }
    }

    getNextStops(id){
        if (!this.adjacencyList[id]) {
            console.warn(`Node does not exist`);
            return [];
        }
        return this.adjacencyList[id];
    }

    //Debugging purpose
    displayGraph() {
        console.log("\n===== NYC Transit Graph Structure =====");
        for (let id in this.adjacencyList) {
            const node = this.nodes[id];
            const edges = this.adjacencyList[id];
            let edgeString = edges.map(e => 
                `[→ ${e.nodeId} (T:${e.transitTime}m, W:${e.walkTime}m)]`
            ).join(", ");
            
            console.log(`${id} (${node.Location.name}): ${edgeString || "(No edges)"}`);
        }
        console.log("=======================================\n");
    }
}

// Test Graph generation
// create Graph
const myGraph = new TransitGraph(new Location("src","-1",40.7592,-73.9871), new Location("dst","-2",40.7692,-73.1851));

// create Nodes
myGraph.addStop("A", "Times Sq Station", "1",40.7588, -73.9851);
myGraph.addStop("B", "Grand Central", "2", 40.7527, -73.9772);
myGraph.addStop("C", "Penn Station", "3", 40.7505, -73.9934);

// create Edges
myGraph.addEdge(0, "A", 0, 5, 0.4);         // 1
myGraph.addEdge(0, "C", 0, 10, 0.8);        // 2
myGraph.addEdge("A", "B", 3, 0, 1.2);       // 3
myGraph.addEdge("A", 1, 2, 0, 0.5);         // 4
myGraph.addEdge("B", 1, 4, 0, 1.5);         // 5
myGraph.addEdge("C", "A", 5, 0, 1.1);       // 6
myGraph.addEdge("C", "B", 6, 0, 1.8);       // 7
myGraph.addEdge("B", "A", 3, 0, 1.2);       // 8 
myGraph.addEdge(1, 0, 0, 15, 2.0);          // 9 
myGraph.addEdge("A", "C", 5, 0, 1.1);       // 10
myGraph.addEdge(0, "B", 0, 12, 1.0);        // 11

myGraph.displayGraph();
console.log("next stops:", myGraph.getNextStops(0));