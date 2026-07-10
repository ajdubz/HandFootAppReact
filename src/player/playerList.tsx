import { useCallback, useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { Link, useNavigate } from "react-router-dom";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import FriendService from "../services/FriendService";
import PlayerFriendBasicDTO from "../models/DTOs/Player/PlayerFriendBasicDTO";

const isGuestPlayer = (player: PlayerGetBasicDTO): boolean => {
    const email = (player.email ?? "").toLowerCase();
    const nickName = (player.nickName ?? "").trim().toLowerCase();
    const fullName = (player.fullName ?? "").trim().toLowerCase();
    return player.isGuest === true ||
        email.endsWith("@mock.local") ||
        email.endsWith("@firebase.local") ||
        email.includes("@guest.") ||
        nickName === "guest player" ||
        fullName === "guest player";
};

const PlayerListTable = () => {
    const [players, setPlayers] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [friends, setFriends] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [sentFriendRequests, setSentFriendRequests] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const navigateTo = useNavigate();
    const currentPlayerId = Number(localStorage.getItem("currentPlayerId") ?? localStorage.getItem("mockPlayerId") ?? 0);

    const fetchData = useCallback(async () => {
        await PlayerService.getPlayers()
            .then((data) => {
                setPlayers(data ?? []);
            })
            .catch((error) => console.error(error));

        if (!currentPlayerId) {
            setFriends([]);
            setSentFriendRequests([]);
            return;
        }

        await FriendService.getFriends(currentPlayerId)
            .then((data) => setFriends(data ?? []))
            .catch((error) => console.error(error));

        await FriendService.getSentFriendRequests(currentPlayerId)
            .then((data) => setSentFriendRequests(data ?? []))
            .catch((error) => console.error(error));
    }, [currentPlayerId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sendFriendRequest = async (friendId: number) => {
        if (!currentPlayerId || !friendId || friendId === currentPlayerId) {
            return;
        }

        const playerFriend = new PlayerFriendBasicDTO();
        playerFriend.playerId = currentPlayerId;
        playerFriend.friendId = friendId;

        await FriendService.sendFriendRequest(currentPlayerId, playerFriend)
            .then(() => fetchData())
            .catch((error) => console.error(error));
    };

    const isAlreadyFriend = (playerId: number) => (friends ?? []).some((friend) => friend.id === playerId);
    const isPendingRequest = (playerId: number) => (sentFriendRequests ?? []).some((friend) => friend.id === playerId);

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {(players ?? []).map((player) => {
                        const isCurrentUser = (player.id ?? 0) === currentPlayerId;
                        const playerId = player.id ?? 0;
                        const isGuest = isGuestPlayer(player);
                        const showSendRequest = !isCurrentUser && !isGuest && !isAlreadyFriend(playerId) && !isPendingRequest(playerId);

                        return (
                            <tr key={player.id}>
                                <td>
                                    {isCurrentUser ? (
                                        <strong>
                                            <button type="button" className="link-button" onClick={() => navigateTo(`/player/${player.id}`)}>
                                                {player.nickName}
                                            </button>
                                        </strong>
                                    ) : (
                                        <strong>{player.nickName}</strong>
                                    )}
                                    {` (${player.fullName})`}
                                </td>
                                <td>
                                    {showSendRequest && (
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => sendFriendRequest(playerId)}>
                                            Send Friend Request
                                        </button>
                                    )}
                                    {!showSendRequest && !isCurrentUser && isGuest && (
                                        <span>Guest account</span>
                                    )}
                                    {!showSendRequest && !isCurrentUser && !isGuest && isPendingRequest(playerId) && (
                                        <span>Request Sent</span>
                                    )}
                                    {!showSendRequest && !isCurrentUser && !isGuest && isAlreadyFriend(playerId) && (
                                        <span>Already Friends</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <br />
            <div>
                <span>
                    <Link to="/player/account">Add Player</Link>
                </span>
            </div>
        </div>
    );
};


const ListFriends = (friends: PlayerGetBasicDTO[] | undefined, onClickFunc: (playerSelected: PlayerGetBasicDTO | undefined) => void) => {
    return (
        <div>
            {friends?.map((friend) => (
                <div key={friend.id}><strong><button type="button" className="link-button" onClick={() => onClickFunc(friend)}>{friend.nickName}</button></strong>{" (" + friend.fullName + ")"}</div>
            ))}
        </div>
    );
};


const performPlayerSearch = async (inId: number, searchText: string, setSearchPlayersFunc: ( players: PlayerGetBasicDTO[] | undefined, text: string) => void)=> {
    if (searchText === "") {
        setSearchPlayersFunc(undefined, "");
        return { inId, searchText, setSearchPlayersFunc };
    }

    return await FriendService.searchNewFriends(inId, searchText).then((data) => setSearchPlayersFunc(data, searchText)).catch((error) => console.error(error));
}

const performFriendSearch = async (inId: number, searchText: string, setSearchPlayersFunc: ( players: PlayerGetBasicDTO[] | undefined, text: string) => void)=> {
    if (searchText === "") {
        setSearchPlayersFunc(undefined, "");
        return { inId, searchText, setSearchPlayersFunc };
    }

    return await FriendService.searchCurrentFriends(inId, searchText).then((data) => setSearchPlayersFunc(data, searchText)).catch((error) => console.error(error));
}



export { PlayerListTable, ListFriends, performPlayerSearch, performFriendSearch };
