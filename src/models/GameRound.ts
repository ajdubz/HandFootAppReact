import GameTeam from "./GameTeam";

class GameRound {

    public id?: number = 0;
    public gameTeam?: GameTeam = new GameTeam();
    public roundNumber?: number = 0;
    public totalScore?: number = 0;

}

export default GameRound;