import GetTeamsByPlayerIdsDTO from "../models/DTOs/Team/GetTeamsByPlayerIdsDTO";
import TeamService from "./TeamService";

describe("TeamService.getTeamsByPlayers", () => {
    const originalApiUrl = process.env.REACT_APP_API_URL;
    const originalFetch = global.fetch;

    beforeEach(() => {
        process.env.REACT_APP_API_URL = "http://localhost:8000";
        localStorage.clear();
        localStorage.setItem("token", "test-token");
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: jest.fn().mockResolvedValue(JSON.stringify([])),
        } as unknown as Response);
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    afterAll(() => {
        process.env.REACT_APP_API_URL = originalApiUrl;
    });

    test("posts player ids to the FastAPI team lookup endpoint", async () => {
        const getTeamsByPlayers = new GetTeamsByPlayerIdsDTO();
        getTeamsByPlayers.player1Id = 7;
        getTeamsByPlayers.player2Id = 9;

        const teams = await TeamService.getTeamsByPlayers(getTeamsByPlayers);

        expect(teams).toEqual([]);
        expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/Team/Players", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer test-token",
            },
            body: JSON.stringify({
                player1Id: 7,
                player2Id: 9,
            }),
        });
    });
});
