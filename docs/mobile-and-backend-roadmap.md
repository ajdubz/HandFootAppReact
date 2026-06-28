# Mobile and Backend Roadmap

## Recommendation

Build the backend/data foundation before doing the full Capacitor conversion, while making small mobile-readiness improvements in the web app along the way.

The mobile app should not become a second source of truth. Long-term game history, round edits, stats, player/team data, and auth should flow through one API/data model that both web and mobile use. Capacitor is still the recommended mobile path for this app, but it will be cleaner after the API and persistence contracts are stable.

## Why Backend First

- The current frontend already has service classes shaped around API calls, so the web app is expecting a backend-style architecture.
- Mobile needs a reachable API anyway; `localhost` behavior and environment config are different on devices and emulators.
- Long-term scorekeeping features depend on durable data: saved games, previous round edits, history, and stats.
- Shared APIs reduce duplicate work between web and mobile.
- Mobile packaging before stable persistence risks spending time debugging app-shell behavior around temporary data flows.

## Work To Do Now

- Keep the app framed as a real-life Hand and Foot scorekeeper, not an online card game.
- Preserve scorekeeping terminology such as book/books.
- Make the current web app build and test clean before adding native projects.
- Add a small auth/storage abstraction so code does not call `localStorage` directly everywhere.
- Add an API config helper so services do not read `process.env.REACT_APP_API_URL` directly in every method.
- Identify mobile-critical screens:
  - Login
  - Player details
  - Start game
  - Game home
  - Finish/edit round
  - Game history
- Keep mobile CSS improvements focused on touch-friendly score entry, readable tables, and modal behavior.

## Backend Foundation

Initial backend work should define and implement the minimum durable scorekeeper API:

- Auth/login and current player identity.
- Players and guest players.
- Friends/player search.
- Teams and team membership.
- Games with fixed four-round Hand and Foot structure.
- Game teams.
- Round entries, saved as one round/team record per round.
- Edit previous round support before deeper stats.
- Completed game and game history retrieval.

The first database model should support the real scorekeeping workflow rather than trying to model an online card game.

## Capacitor PoC

After the backend contract is stable enough for real flows, create a clean branch and add Capacitor inside this repo.

Expected setup:

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init
npm install @capacitor/android @capacitor/ios
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

Expected repo additions:

- `capacitor.config.ts`
- `android/`
- `ios/`
- package scripts for build/sync/open commands

Definition of done for the PoC:

- Android app launches from a native shell.
- iOS project exists and can be opened/run on a Mac with Xcode.
- Web app still works.
- Native app reaches the backend API.
- Auth survives app close/reopen.
- One core flow works on mobile:
  - login
  - open player
  - start game
  - view game
  - enter or edit a round

## Suggested Sequence

1. Finish the core web scorekeeper loop and manual QA the four-round flow.
2. Add edit support for previous rounds.
3. Build the backend/database contract for saved players, teams, games, and rounds.
4. Wire the web app to the backend and keep mock/local development support where useful.
5. Add game history and completed game views.
6. Add the Capacitor shell in this repo.
7. Run Android first, then validate iOS on a Mac.
8. Polish mobile UI and storage behavior.
9. Add deeper stats once round/game data is reliable.

## Notes

- Android work can be done from Windows with Android Studio.
- iOS build/run requires macOS and Xcode.
- Store-ready mobile work will need app name, bundle ID, icons, splash screen, backend HTTPS access, and device testing.
- A separate mobile repo is not recommended unless the product intentionally becomes a distinct React Native app.
