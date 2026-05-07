# Security Specification - GCC TAXI

## Data Invariants
1. A **Trip** must have a valid customer name, phone, and date.
2. **Site Settings** (`/settings/site`) can only be modified by Admins.
3. **Fixed Routes**, **Services**, and **Specialized Services** are read-only for public, write-only for Admins.
4. Users can only read/write their own **User** profile.
5. **Drivers** can update their own location and status.
6. **Bookings** can be created by anyone (public booking) but only modified by the assigned driver or admin.

## The Dirty Dozen Payloads (Failed Test Cases)

1. **Identity Spoofing (Services)**: Public user tries to delete a service.
   - `DELETE /services/luxury_sedan` -> PERMISSION_DENIED
2. **Identity Spoofing (Settings)**: Public user tries to disable sections.
   - `UPDATE /settings/site { showServicesSection: false }` -> PERMISSION_DENIED
3. **Identity Spoofing (User)**: User A tries to read User B's profile.
   - `GET /users/user_b_id` -> PERMISSION_DENIED
4. **Identity Spoofing (Admin)**: User tries to add themselves to `adminEmails` in site settings.
   - `UPDATE /settings/site { adminEmails: ['attacker@evil.com'] }` -> PERMISSION_DENIED
5. **Resource Poisoning (Routes)**: Public user tries to create a route with 0 price.
   - `CREATE /fixed_routes { pickup: 'A', dropoff: 'B', price: 0 }` -> PERMISSION_DENIED
6. **State Shortcutting (Trips)**: User tries to change a trip status to 'Completed' without paying.
   - `UPDATE /trips/trip_id { status: 'Completed' }` -> PERMISSION_DENIED
7. **Shadow Update (Services)**: Admin tries to add a `ghost_field` during update.
   - `UPDATE /services/id { ghost: true }` -> PERMISSION_DENIED (Strict keys enforced)
8. **PII Blanket (Users)**: Signed-in user tries to list all user emails.
   - `LIST /users` -> PERMISSION_DENIED
9. **Query Trust (Trips)**: User tries to list all trips in the system.
   - `LIST /trips` -> PERMISSION_DENIED (Must be admin or owner)
10. **Terminal State Locking (Trips)**: Driver tries to delete a 'Completed' trip.
    - `DELETE /trips/completed_trip_id` -> PERMISSION_DENIED
11. **Immortal Field (Services)**: Admin tries to change a service ID.
    - `UPDATE /services/id { id: 'new_id' }` -> PERMISSION_DENIED
12. **Temporal Integrity (Trips)**: Client tries to set `createdAt` in the past.
    - `CREATE /trips { createdAt: '2020-01-01' }` -> PERMISSION_DENIED (Must match request.time)

## Test Runner (Logic Simulation)

The following `firestore.rules` will be verified against these invariants.
