import { useCallback, useEffect, useState } from "react";
import FriendService from "../services/FriendService";
import { Link, useNavigate, useParams } from "react-router-dom";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import PlayerFriendBasicDTO from "../models/DTOs/Player/PlayerFriendBasicDTO";
import "./playerFriends.css";

interface RouteParams {
    [id: string]: string | undefined;
}

type FriendAction = "accept" | "decline" | "send";
const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 250;

const getPlayerLabel = (player: PlayerGetBasicDTO): string => {
    const nickName = player.nickName?.trim();
    const fullName = player.fullName?.trim();

    if (nickName && fullName) {
        return `${nickName} (${fullName})`;
    }

    return nickName || fullName || "Unnamed player";
};

const toPlayerFriend = (playerId: number, friendId: number): PlayerFriendBasicDTO => {
    const playerFriend = new PlayerFriendBasicDTO();
    playerFriend.playerId = playerId;
    playerFriend.friendId = friendId;
    return playerFriend;
};

const getFriendActionErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes("permission") || message.includes("missing or insufficient permissions")) {
            return "Firebase blocked this friend update. Restart the emulators or deploy the latest Firestore rules, then try again.";
        }
    }

    if (error && typeof error === "object" && "code" in error && String(error.code).includes("permission-denied")) {
        return "Firebase blocked this friend update. Restart the emulators or deploy the latest Firestore rules, then try again.";
    }

    return "That friend update did not save. Give it another shot.";
};

function PlayerFriends(): React.ReactElement {
    const { id = "" } = useParams<RouteParams>();
    const playerId = Number(id);
    const navigateTo = useNavigate();
    const [friends, setFriends] = useState<PlayerGetBasicDTO[]>([]);
    const [friendRequests, setFriendRequests] = useState<PlayerGetBasicDTO[]>([]);
    const [sentFriendRequests, setSentFriendRequests] = useState<PlayerGetBasicDTO[]>([]);
    const [searchPlayersResults, setSearchPlayersResults] = useState<PlayerGetBasicDTO[]>([]);
    const [searchText, setSearchText] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [busyAction, setBusyAction] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [searchError, setSearchError] = useState<string>("");

    const fetchData = useCallback(async () => {
        if (!playerId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const [friendsData, requestData, sentData] = await Promise.all([
                FriendService.getFriends(playerId),
                FriendService.getFriendRequests(playerId),
                FriendService.getSentFriendRequests(playerId),
            ]);

            setFriends(friendsData ?? []);
            setFriendRequests(requestData ?? []);
            setSentFriendRequests(sentData ?? []);
        } catch (fetchError) {
            console.error("Error loading friends:", fetchError);
            setError("We could not load your friend activity. Try again in a minute.");
        } finally {
            setIsLoading(false);
        }
    }, [playerId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const nextSearch = searchText.trim();
        setSearchError("");

        if (!nextSearch || nextSearch.length < MIN_SEARCH_LENGTH || !playerId) {
            setSearchPlayersResults([]);
            setIsSearching(false);
            return;
        }

        let isCurrentSearch = true;

        const searchTimer = window.setTimeout(() => {
            if (isCurrentSearch) {
                setIsSearching(true);
            }

            FriendService.searchNewFriends(playerId, nextSearch)
                .then((data) => {
                    if (isCurrentSearch) {
                        setSearchPlayersResults(data ?? []);
                    }
                })
                .catch((searchFailure) => {
                    console.error("Error searching players:", searchFailure);
                    if (isCurrentSearch) {
                        setSearchPlayersResults([]);
                        setSearchError("Player search is not available right now.");
                    }
                })
                .finally(() => {
                    if (isCurrentSearch) {
                        setIsSearching(false);
                    }
                });
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            isCurrentSearch = false;
            window.clearTimeout(searchTimer);
        };
    }, [playerId, searchText]);

    const updateRequest = async (action: FriendAction, friendId: number) => {
        if (!playerId || !friendId) {
            return;
        }

        const actionKey = `${action}-${friendId}`;
        setBusyAction(actionKey);
        setError("");
        setSearchError("");
        setMessage("");

        try {
            const playerFriend = toPlayerFriend(playerId, friendId);

            if (action === "accept") {
                await FriendService.acceptFriendRequest(playerId, playerFriend);
                setMessage("Friend request accepted.");
            }

            if (action === "decline") {
                await FriendService.declineFriendRequest(playerId, playerFriend);
                setMessage("Friend request declined.");
            }

            if (action === "send") {
                await FriendService.sendFriendRequest(playerId, playerFriend);
                setSearchPlayersResults((current) => current.filter((player) => player.id !== friendId));
                setSearchText("");
                setMessage("Friend request sent.");
            }

            await fetchData();
        } catch (actionError) {
            console.error("Error updating friend request:", actionError);
            setError(getFriendActionErrorMessage(actionError));
        } finally {
            setBusyAction("");
        }
    };

    return (
        <div className="friends-page">
            <div className="friends-header">
                <div>
                    <h1>Friends</h1>
                    <p>Find players, manage requests, and keep your scorekeeping circle ready.</p>
                </div>
                <Link className="friends-back-link" to={`/player/${playerId}`}>Back to player home</Link>
            </div>

            {message && <div className="friends-alert friends-alert-success" role="status">{message}</div>}
            {error && <div className="friends-alert friends-alert-error" role="alert">{error}</div>}

            <section className="friends-section" aria-labelledby="friend-search-heading">
                <div className="friends-section-heading">
                    <h2 id="friend-search-heading">Find Players</h2>
                    <span>Search by nickname or name</span>
                </div>
                <label className="friends-search-label" htmlFor="friend-search">
                    Search players
                </label>
                <input
                    id="friend-search"
                    className="friends-search-input"
                    type="search"
                    placeholder="Type a player name"
                    value={searchText}
                    onChange={(event) => {
                        setSearchText(event.target.value);
                        setMessage("");
                    }}
                />
                <div className={`friends-search-status${searchError ? " friends-search-status-error" : ""}`} role={searchError ? "alert" : "status"}>
                    {searchError}
                </div>
                <div className="friends-list" aria-live="polite">
                    {!searchError && !isSearching && searchText.trim().length >= MIN_SEARCH_LENGTH && searchPlayersResults.length === 0 && (
                        <div className="friends-empty">No available players found.</div>
                    )}
                    {!searchError && !isSearching && searchPlayersResults.map((player) => {
                        const friendId = player.id ?? 0;
                        return (
                            <div className="friends-row" key={friendId}>
                                <div>
                                    <strong>{player.nickName}</strong>
                                    <span>{player.fullName}</span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    disabled={busyAction === `send-${friendId}`}
                                    onClick={() => updateRequest("send", friendId)}
                                >
                                    {busyAction === `send-${friendId}` ? "Sending..." : "Send Request"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="friends-section" aria-labelledby="friend-requests-heading">
                <div className="friends-section-heading">
                    <h2 id="friend-requests-heading">Requests</h2>
                    <span>{friendRequests.length} incoming</span>
                </div>
                {renderRequests()}
            </section>

            <section className="friends-section" aria-labelledby="sent-requests-heading">
                <div className="friends-section-heading">
                    <h2 id="sent-requests-heading">Pending Sent</h2>
                    <span>{sentFriendRequests.length} waiting</span>
                </div>
                {renderPlayerList(sentFriendRequests, "No outgoing requests. The ball is not currently in anyone else's court.")}
            </section>

            <section className="friends-section" aria-labelledby="friends-list-heading">
                <div className="friends-section-heading">
                    <h2 id="friends-list-heading">Your Friends</h2>
                    <span>{friends.length} connected</span>
                </div>
                {isLoading ? (
                    <div className="friends-empty">Loading friends...</div>
                ) : renderPlayerList(friends, "No friends yet. Search for players above to get started.")}
            </section>
        </div>
    );

    function renderRequests() {
        if (isLoading) {
            return <div className="friends-empty">Loading requests...</div>;
        }

        if (friendRequests.length === 0) {
            return <div className="friends-empty">No incoming requests.</div>;
        }

        return (
            <div className="friends-list">
                {friendRequests.map((player) => {
                    const friendId = player.id ?? 0;
                    return (
                        <div className="friends-row" key={friendId}>
                            <button
                                type="button"
                                className="friends-player-button"
                                onClick={() => navigateTo(`/player/${friendId}`)}
                            >
                                {getPlayerLabel(player)}
                            </button>
                            <div className="friends-actions">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-success"
                                    disabled={busyAction === `accept-${friendId}`}
                                    onClick={() => updateRequest("accept", friendId)}
                                >
                                    {busyAction === `accept-${friendId}` ? "Accepting..." : "Accept"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-light"
                                    disabled={busyAction === `decline-${friendId}`}
                                    onClick={() => updateRequest("decline", friendId)}
                                >
                                    {busyAction === `decline-${friendId}` ? "Declining..." : "Decline"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    function renderPlayerList(players: PlayerGetBasicDTO[], emptyText: string) {
        if (players.length === 0) {
            return <div className="friends-empty">{emptyText}</div>;
        }

        return (
            <div className="friends-list">
                {players.map((player) => (
                    <button
                        type="button"
                        className="friends-row friends-row-button"
                        key={player.id}
                        onClick={() => navigateTo(`/player/${player.id}`)}
                    >
                        <strong>{player.nickName}</strong>
                        <span>{player.fullName}</span>
                    </button>
                ))}
            </div>
        );
    }
}

export default PlayerFriends;
