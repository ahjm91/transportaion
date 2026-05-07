# Application Rules and Core Settings

## Core Data Preservation
The following Firestore collections contain **Master Settings** and must **NEVER** be deleted or resetted automatically:
- `fixed_routes`: Contains the predefined travel routes and pricing (Destinations).
- `settings`: Contains site-wide configuration (Company name, contact info, hero content).
- `services`: Contains the available fleet/service types.
- `specialized_services`: Contains the landing page highlighted services.

## Modification Policy
- Only modify these collections if explicitly requested by the user.
- These collections are initialized (seeded) in `server.ts` if they are empty. 
- If you need to add new routes or settings, do so via the Admin Dashboard or by adding to the seeding logic in `server.ts`.

## Firebase Configuration
- The app uses a hybrid initialization (Admin SDK + Client SDK on the server) to ensure maximum compatibility and bypass IAM role issues in the AI Studio preview environment.
- Do not revert `server.ts` to standard `admin.initializeApp` without testing connectivity.

## Baseline Reliability
- The current implementation is considered the **Base Stable Version**.
- **Admin Seeding**: The `server.ts` performs automatic seeding of admin accounts and base settings. This must remain intact as it ensures the app is always functional upon deployment.
- **Error Handling**: The `auth/operation-not-allowed` logic in `AuthScreen.tsx` and `server.ts` is essential for diagnosing Firebase configuration issues.
