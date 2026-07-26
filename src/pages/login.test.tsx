import { getLoginErrorMessage } from "./login";

describe("login error messages", () => {
    test("only reports incorrect credentials for Firebase credential errors", () => {
        expect(getLoginErrorMessage({ code: "auth/invalid-credential" })).toBe("Incorrect user or password");
        expect(getLoginErrorMessage({ code: "auth/wrong-password" })).toBe("Incorrect user or password");
    });

    test("distinguishes Firebase configuration and availability failures", () => {
        expect(getLoginErrorMessage({ code: "auth/operation-not-allowed" }))
            .toBe("Email/password login is not enabled in Firebase.");
        expect(getLoginErrorMessage({ code: "auth/network-request-failed" }))
            .toBe("Unable to reach Firebase. Check your connection and try again.");
        expect(getLoginErrorMessage(new Error("Firebase Auth is not configured.")))
            .toBe("Firebase login is not configured correctly for this deployment.");
    });
});
