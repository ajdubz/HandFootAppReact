import TeamGetBasicDTO from "../Team/TeamGetBasicDTO";
import PlayerGetBasicDTO from "./PlayerGetBasicsDTO";

class PlayerGetWithFriendsDTO {
    id?: number = 0;
    nickName?: string = '';
    email?: string = '';
    team?: TeamGetBasicDTO = new TeamGetBasicDTO();
    friends?: PlayerGetBasicDTO[] = [];

}

export default PlayerGetWithFriendsDTO;