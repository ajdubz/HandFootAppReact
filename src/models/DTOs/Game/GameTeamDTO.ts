import Game from "../../Game";
import { Team } from "../../Team";
import PlayerGetBasicDTO from "../Player/PlayerGetBasicDTO";
import TeamGetWithPlayerNamesDTO from "../Team/TeamGetWithPlayerNamesDTO";
import GameAddDTO from "./GameAddDTO";

class GameTeamDTO {

    public id?: number;
    public game?: GameAddDTO = new GameAddDTO();
    public team?: TeamGetWithPlayerNamesDTO = new TeamGetWithPlayerNamesDTO();

}

export default GameTeamDTO;