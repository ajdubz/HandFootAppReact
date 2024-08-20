
class PlayerFriendBasicDTO {

    public playerId: number;
    public friendId: number;

    constructor(PlayerId: number, FriendId: number) {
        this.playerId = PlayerId;
        this.friendId = FriendId;
    }
}

export default PlayerFriendBasicDTO;