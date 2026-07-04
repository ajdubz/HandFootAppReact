# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Product Direction

See [ROADMAP.md](./ROADMAP.md) for the current direction: keep this as a React website first, evolve toward a PWA-ready local-first scorekeeper, then add a backend.

## Available Scripts

In the project directory, you can run:

### `npm run start:mock`

Runs the app against the local in-browser mock data backend.

### `npm run start:api`

Runs the app against the sibling FastAPI backend at `http://127.0.0.1:8000`.

### `npm run start:firebase`

Runs the app in Firebase data mode. Create a local `.env.local` from `.env.example`, set `REACT_APP_DATA_BACKEND=firebase`, and fill in the `REACT_APP_FIREBASE_*` values from the Firebase web app config.

For local Firebase emulator testing, set:

```text
REACT_APP_FIREBASE_USE_EMULATORS=true
REACT_APP_FIREBASE_AUTH_EMULATOR_URL=http://127.0.0.1:9099
REACT_APP_FIREBASE_FIRESTORE_EMULATOR_HOST=127.0.0.1
REACT_APP_FIREBASE_FIRESTORE_EMULATOR_PORT=8080
```

Firebase mode still uses the same React service layer as mock and API mode. React components should not call Firebase directly.

### Firebase smoke test checklist

Before deploying Firebase mode, run through this path against the Firebase emulators:

1. Register a player with email/password.
2. Log out and log back in.
3. Start a guest session.
4. Create temporary guest players from the start-game flow.
5. Create two teams.
6. Create a game and add both teams.
7. Save rounds 1 through 4.
8. Refresh the browser and confirm the game, teams, and rounds reload.
9. Start a two-player-per-team game and confirm typed-in guest teammates are saved.
10. Confirm `Delete My Previous Games` is hidden in Firebase mode.
11. Confirm `npm.cmd test -- --watchAll=false --cacheDirectory=.jest-cache`, `npm.cmd run build`, and dependency vulnerability checks pass.

Friend-request smoke testing is deferred until the Friends screen supports friend search and clearer add/manage workflows.

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
