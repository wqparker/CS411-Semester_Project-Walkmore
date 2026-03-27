import { Location } from './Location.js';
import { Node } from './GraphNode.js';
export class TransitGraph {
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
                `[→ ${e.nodeId} (T:${e.transitTime}m, W:${e.walkTime}m), D:${e.distance}m]`
            ).join(", ");
            
            console.log(`${id} (${node.Location.name}): ${edgeString || "(No edges)"}`);
        }
        console.log("=======================================\n");
    }
}

