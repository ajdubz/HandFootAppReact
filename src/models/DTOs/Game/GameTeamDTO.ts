import Game from "../../Game";
import { Team } from "../../Team";

class GameTeamDTO {

    public id?: number;
    public game?: Game = new Game();
    public team?: Team = new Team();

}

export default GameTeamDTO;