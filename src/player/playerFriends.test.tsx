import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import FriendService from "../services/FriendService";
import PlayerFriends from "./playerFriends";

jest.mock("../services/FriendService", () => ({
    __esModule: true,
    default: {
        getFriends: jest.fn(),
        getFriendRequests: jest.fn(),
        getSentFriendRequests: jest.fn(),
        searchNewFriends: jest.fn(),
        sendFriendRequest: jest.fn(),
        acceptFriendRequest: jest.fn(),
        declineFriendRequest: jest.fn(),
    },
}));

describe("PlayerFriends workflow", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (FriendService.getFriends as jest.Mock).mockResolvedValue([
            { id: 2, nickName: "Sam", publicTag: "SAM1234" },
        ]);
        (FriendService.getFriendRequests as jest.Mock).mockResolvedValue([
            { id: 4, nickName: "Casey", publicTag: "CAS1234" },
        ]);
        (FriendService.getSentFriendRequests as jest.Mock).mockResolvedValue([
            { id: 3, nickName: "Jordan", publicTag: "JOR1234" },
        ]);
        (FriendService.searchNewFriends as jest.Mock).mockResolvedValue([
            { id: 5, nickName: "Logan", publicTag: "LOG1234" },
        ]);
        (FriendService.sendFriendRequest as jest.Mock).mockResolvedValue(undefined);
        (FriendService.acceptFriendRequest as jest.Mock).mockResolvedValue(undefined);
        (FriendService.declineFriendRequest as jest.Mock).mockResolvedValue(undefined);
    });

    test("shows friends, incoming requests, sent requests, and searchable players", async () => {
        renderFriendsPage();

        expect(screen.getByText(/search by nickname or #tag/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/type a nickname or #tag/i)).toBeInTheDocument();
        expect(await screen.findByText("Sam#SAM1234")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /casey#cas1234/i })).toBeInTheDocument();
        expect(screen.getByText("Jordan#JOR1234")).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/^search players$/i), { target: { value: "log" } });

        expect(await screen.findByText("Logan#LOG1234")).toBeInTheDocument();
        expect(FriendService.searchNewFriends).toHaveBeenCalledWith(1, "log");
    });

    test("sends, accepts, and declines requests through FriendService", async () => {
        renderFriendsPage();

        expect(await screen.findByRole("button", { name: /casey#cas1234/i })).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/^search players$/i), { target: { value: "log" } });
        fireEvent.click(await screen.findByRole("button", { name: /send request/i }));

        await waitFor(() => expect(FriendService.sendFriendRequest).toHaveBeenCalledWith(1, expect.objectContaining({
            playerId: 1,
            friendId: 5,
        })));
        expect(await screen.findByText(/friend request sent/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));

        await waitFor(() => expect(FriendService.acceptFriendRequest).toHaveBeenCalledWith(1, expect.objectContaining({
            playerId: 1,
            friendId: 4,
        })));

        fireEvent.click(screen.getByRole("button", { name: /^decline$/i }));

        await waitFor(() => expect(FriendService.declineFriendRequest).toHaveBeenCalledWith(1, expect.objectContaining({
            playerId: 1,
            friendId: 4,
        })));
    });
});

function renderFriendsPage() {
    render(
        <MemoryRouter initialEntries={["/player/1/friends"]}>
            <Routes>
                <Route path="/player/:id/friends" element={<PlayerFriends />} />
            </Routes>
        </MemoryRouter>
    );
}
