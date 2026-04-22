// Collection: 'trips'
// One document per trip taken, regardless of completion.

export function createTrip({ google_id, destination, path, startTime, endTime,
  distKm, walkMinutes, totalMinutes, estimatedSteps, estimatedCalories, optimization, completed }) {
  return {
    google_id,          // string - links to users collection
    destination,        // string - user-entered destination
    path,               // string[] - stop names from route
    optimization,       // 'time' | 'walking' | 'balanced'
    startTime,          // Date
    endTime,            // Date
    completed,          // bool - true if arrived, false if ended early
    distKm,             // number
    walkMinutes,        // number
    totalMinutes,       // number
    estimatedSteps,     // number
    estimatedCalories,  // number
  };
}