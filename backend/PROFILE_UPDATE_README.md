# User Profile Address Update Implementation

## Overview
This implementation adds the ability to store and update user address information in the Eventia backend system. Previously, the address data sent in the update profile request was being ignored. Now, the system will properly store this information in a dedicated `user_profiles` table.

## Changes Made

1. **Database Schema Update**:
   - Added a new `UserProfile` model to the Prisma schema
   - Created a migration to add the `user_profiles` table in the database
   - Established a one-to-one relationship between `User` and `UserProfile`

2. **API Controller Updates**:
   - Modified `updateProfile` method in `UserControllerV1` to handle address data
   - Updated `getProfile` method to include profile information in the response

## New Features

- Users can now update their address information using the existing profile update endpoint
- Address information is stored separately from core user data for better organization
- Profile data is included when fetching user profile information

## API Usage

### Update Profile with Address

```bash
PUT /api/v1/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "ST",
    "postalCode": "12345",
    "country": "Country"
  }
}
```

### Get Profile with Address

```bash
GET /api/v1/users/profile
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile fetched successfully",
  "data": {
    "id": "user-id",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "profile": {
      "id": "profile-id",
      "userId": "user-id",
      "street": "123 Main St",
      "city": "Anytown",
      "state": "ST",
      "postalCode": "12345",
      "country": "Country",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

## Running the Migration

To apply the database changes, run the migration script:

```bash
npx ts-node src/scripts/run-migration.ts
```

Or use the Prisma CLI directly:

```bash
npx prisma migrate dev --name add_user_profile_model
```

## Testing

After running the migration, you can test the new functionality using the API endpoints described above. The address information should now be properly stored and retrieved with the user profile.