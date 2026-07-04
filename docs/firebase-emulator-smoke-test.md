# Firebase Emulator Smoke Test

Use this before deploying Firebase mode. It verifies the real Firebase adapters, Auth emulator, Firestore emulator, rules, indexes, and the minimum scorekeeping loop.

## Prerequisites

1. Install or make the Firebase CLI available on your PATH.
2. Copy `.env.example` to `.env.local`.
3. Set `REACT_APP_DATA_BACKEND=firebase`.
4. Fill in the `REACT_APP_FIREBASE_*` values from the Firebase web app config.
5. Set `REACT_APP_FIREBASE_USE_EMULATORS=true`.
6. Confirm `.firebaserc` points at the intended Firebase project.

## Terminal 1

```powershell
npm.cmd run firebase:emulators
```

Expected emulator ports from `firebase.json`:

- Auth: `127.0.0.1:9099`
- Firestore: `127.0.0.1:8080`

The package script calls `firebase.cmd` directly so Windows PowerShell execution policy does not block `firebase.ps1`.

## Terminal 2

```powershell
npm.cmd run start:firebase:emulators
```

Open `http://localhost:3000`.

## Core Manual Path

1. Register a new player with email/password.
2. Log out and log back in with that player.
3. Start a guest session.
4. Create temporary guest players from the start-game flow.
5. Create two teams.
6. Create a game and add both teams.
7. Save rounds 1 through 4.
8. Refresh the browser and confirm the game, teams, and rounds reload.
9. Start a two-player-per-team game and confirm typed-in guest teammates are saved.
10. Confirm the team list does not show `Delete My Previous Games` in Firebase mode.

## Deferred Friend Path

Friend-request smoke testing is intentionally deferred until the Friends screen supports friend search and clearer add/manage workflows.

Before enabling Firebase friend requests publicly:

1. Search for a player who has not already played on a team with the current player.
2. Send a friend request.
3. Open the recipient player's friends page and accept the request.
4. Confirm both players show as friends.

## Validation Gate

After the core manual path:

```powershell
npm.cmd test -- --watchAll=false --cacheDirectory=.jest-cache
npm.cmd run build
npm.cmd audit --audit-level=low
```

Do not deploy Firebase mode publicly until the core manual path, automated validation, Firestore rules review, and dependency vulnerability cleanup pass.
