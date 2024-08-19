import TeamGetBasicDTO from "../Team/TeamGetBasicDTO";
import PlayerGetBasicDTO from "./PlayerGetBasicsDTO";

class PlayerGetWithFriendsDTO {
    Id: number;
    NickName?: string;
    Team?: TeamGetBasicDTO;
    Friends?: PlayerGetBasicDTO[];

    constructor(id: number, nickName: string, team: TeamGetBasicDTO, friends: PlayerGetBasicDTO[]) {
        this.Id = id;
        this.NickName = nickName;
        this.Team = team;
        this.Friends = friends;
    }

}

export default PlayerGetWithFriendsDTO;