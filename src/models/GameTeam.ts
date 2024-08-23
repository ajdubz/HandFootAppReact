import Game from "./Game";
import { Team } from "./Team";

class GameTeam {

    public id?: number = 0;
    public game?: Game = new Game();
    public team?: Team = new Team();
    public rank?: number = 0;

}

export default GameTeam;