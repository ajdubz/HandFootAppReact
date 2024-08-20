import TeamGetBasicDTO from "../Team/TeamGetBasicDTO";
import PlayerGetBasicDTO from "./PlayerGetBasicsDTO";

class PlayerGetWithFriendsDTO {
    id: number;
    nickName?: string;
    email?: string;
    team?: TeamGetBasicDTO;
    friends?: PlayerGetBasicDTO[];

    constructor(id: number, nickName: string, email: string, team: TeamGetBasicDTO, friends: PlayerGetBasicDTO[]) {
        this.id = id;
        this.nickName = nickName;
        this.email = email;
        this.team = team;
        this.friends = friends;
    }

}

export default PlayerGetWithFriendsDTO;