import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FriendService from "../services/FriendService";
import PlayerService from "../services/PlayerService";
import { PlayerListTable } from "./playerList";

jest.mock("../services/PlayerService", () => ({
    __esModule: true,
    default: {
        getPlayers: jest.fn(),
    },
}));

jest.mock("../services/FriendService", () => ({
    __esModule: true,
    default: {
        getFriends: jest.fn(),
        getSentFriendRequests: jest.fn(),
        sendFriendRequest: jest.fn(),
    },
}));

describe("PlayerListTable", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        localStorage.setItem("currentPlayerId", "1");
        (PlayerService.getPlayers as jest.Mock).mockResolvedValue([
            { id: 1, nickName: "Alex", fullName: "Alex Davis", isGuest: false },
            { id: 2, nickName: "Logan", fullName: "Logan Smith", isGuest: false },
            { id: 3, nickName: "Guest Player", fullName: "Guest Player", isGuest: true },
        ]);
        (FriendService.getFriends as jest.Mock).mockResolvedValue([]);
        (FriendService.getSentFriendRequests as jest.Mock).mockResolvedValue([]);
        (FriendService.sendFriendRequest as jest.Mock).mockResolvedValue(undefined);
    });

    test("does not show friend request actions for guest accounts", async () => {
        render(
            <MemoryRouter>
                <PlayerListTable />
            </MemoryRouter>
        );

        const loganRow = (await screen.findByText(/\(Logan Smith\)/i)).closest("tr");
        const guestRow = (await screen.findByText(/\(Guest Player\)/i)).closest("tr");

        expect(loganRow).not.toBeNull();
        expect(guestRow).not.toBeNull();
        expect(within(loganRow!).getByRole("button", { name: /send friend request/i })).toBeInTheDocument();
        expect(within(guestRow!).queryByRole("button", { name: /send friend request/i })).not.toBeInTheDocument();
        expect(within(guestRow!).getByText(/guest account/i)).toBeInTheDocument();
    });
});
