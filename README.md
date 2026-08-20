# BIM Projects React + Firebase

This is a React version of the original TypeScript dashboard. It keeps projects and to-dos in Firebase Firestore when the Firebase environment variables are configured.

## Setup

1. Create a Firebase project and enable Firestore.
2. Copy `.env.example` to `.env`.
3. Fill in the `VITE_FIREBASE_*` values from your Firebase web app settings.
4. Install and run:

```bash
npm install
npm run dev
```

## Firestore data

Projects are stored in a `projects` collection. Each document contains:

- `name`
- `description`
- `status`
- `userRole`
- `cost`
- `finishDate`
- `todos`
- `createdAt`
- `updatedAt`

The included Firestore rules are open for local learning. Tighten them before using this with real project data.
