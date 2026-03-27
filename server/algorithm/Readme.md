# Route Computation Algorithm

This directory contains the core algorithm for route computation and the necessary `APICaller` class for data retrieval.

##  Prerequisites

- **Node.js**: Ensure Node.js is installed on your system.
- For installation instructions, please refer to the `README.md` located in the **home directory**.

## Running the Algorithm

Currently, command-line arguments are not supported. Please follow the steps below to configure and run the algorithm manually.

### 1. Navigate to the Directory
Open your terminal and locate the algorithm folder:
```bash
cd server/algorithm
node routePlanner.js
```

### 2. To modify inputs
Open the routePlanner.js file\
modify the last line: CalculatePath(src latitude, src longitude, dst latitude, dst longitude, ArrivalTime, WalkingTime);
