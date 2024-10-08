import GameTeamDTO from "../Game/GameTeamDTO";
import PlayerGetBasicDTO from "./PlayerGetBasicDTO";

class PlayerFullDetailsDTO {

    public nickName?: string = '';
    public fullName?: string = '';
    public gameTeams?: GameTeamDTO[] = [];
    public friends?: PlayerGetBasicDTO[] = [];

    
}

export default PlayerFullDetailsDTO;