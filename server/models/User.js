// Collection: 'users'
// One document per registered user.

export function createUser({ google_id, email, name, picture }) {
  return {
    google_id,       // string - Google OAuth sub
    email,           // string
    name,            // string
    picture,         // string - Google profile photo URL
    profile_complete: false,
    created_at: new Date(),
    // Set on profile completion (PUT /api/auth/profile):
    // dob            string - 'YYYY-MM-DD'
    // height_cm      number
    // weight         number
    // units          'imperial' | 'metric'
  };
}