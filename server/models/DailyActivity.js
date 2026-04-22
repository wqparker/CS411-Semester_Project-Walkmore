// Collection: 'daily_activity'
// One document per user per calendar day. Upserted when a trip saves.
// Query by { google_id, date } for a specific day.

export function createDailyActivity({ google_id, date }) {
  return {
    google_id,            // string - links to users collection
    date,                 // string - 'YYYY-MM-DD'
    totalSteps: 0,        // number - cumulative across all trips that day
    totalDistKm: 0,       // number
    totalCalories: 0,     // number
    totalWalkMinutes: 0,  // number
    tripCount: 0,         // number
  };
}