import GameTeamDTO from "../GameTeam/GameTeamDTO";
import PlayerGetBasicDTO from "./PlayerGetBasicDTO";

class PlayerFullDetailsDTO {

    public nickName?: string = '';
    public gameTeams?: GameTeamDTO[] = [];
    public friends?: PlayerGetBasicDTO[] = [];

    
}

export default PlayerFullDetailsDTO;