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

## Friend Path

Before deploying Firebase friend-request changes publicly:

1. Sign into each existing real account once so its public directory entry is created.
2. Confirm each account shows a stable public player ID in `Nickname#TAG` form.
3. Search for a player by nickname using different letter casing.
4. Search for the same player by public tag, beginning with `#`, using different letter casing.
5. Confirm searching by real name or email does not return the player.
6. Send a friend request.
7. Open the recipient player's friends page and accept the request.
8. Confirm both players show as friends with their public player IDs.
9. For a friendship created before participant UID fields were added, have the player who accepted the request open Friends once and then confirm the other participant can see it.

## Production Deployment

Deploy Hosting, Firestore rules, and indexes together:

```powershell
npm.cmd run firebase:deploy
```

Deploying only Hosting can leave stale Firestore rules in production, which makes player discovery and friend activity fail even when the same flows pass against the emulators.

## Validation Gate

After the core manual path:

```powershell
npm.cmd test -- --watchAll=false --cacheDirectory=.jest-cache
npm.cmd run test:firebase:friends
npm.cmd run build:firebase
npm.cmd run test:firebase:hosting
npm.cmd audit --audit-level=low
```

The Hosting smoke test confirms that the SPA shell and rewritten deep links cannot stay stale while fingerprinted JavaScript does not inherit the shell's no-cache policy. `npm.cmd run firebase:deploy` runs the automated Firebase checks before deployment. Do not deploy Firebase mode publicly until the core manual path, automated validation, Firestore rules review, and dependency vulnerability cleanup pass.
