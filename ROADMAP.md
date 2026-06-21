# Hand and Foot App Roadmap

## Direction

Keep the app as a React website for now, then evolve it toward a PWA-ready, local-first scorekeeper before adding the backend.

## Why

- The current app is already a working React web app with responsive mobile scoring work underway.
- A PWA path gives the quickest useful mobile experience without rewriting the UI in React Native.
- Local-first scoring matters because this app is used at a real table, where saved rounds should not depend on perfect network access.
- The existing service layer gives us a good future boundary for a Python backend.
- React Native or Expo can still be considered later, but only if app-store-native behavior becomes worth the UI rewrite.

## Near-Term Priorities

- Keep improving the React website as the primary product.
- Preserve desktop scoring while making mobile scoring fast and touch-friendly.
- Add edit support for previous rounds so scorekeepers can correct mistakes.
- Strengthen local/mock storage into a more deliberate local-first data layer.
- Prepare PWA basics: app manifest, icons, install behavior, offline shell, and clear offline/sync states.

## Later Backend Direction

- Add a Python backend, likely FastAPI, after the core scorekeeping workflow is stable.
- Keep frontend API calls behind service modules so the website, future PWA behavior, and any future mobile client can share the same contract.
- Design sync around local-first scoring rather than assuming every save must immediately reach the server.

## Possible Future Workspace Shape

If the app eventually needs both a website and a true native mobile app, move toward a shared workspace:

```txt
hand-foot/
  apps/
    web/          React website and PWA
    mobile/       Expo or React Native app, if needed later
    backend/      Python/FastAPI backend
  packages/
    core/         scoring rules, DTOs, validation
    api-client/   shared/generated API client
```

For now, avoid this split until it solves a real problem.
