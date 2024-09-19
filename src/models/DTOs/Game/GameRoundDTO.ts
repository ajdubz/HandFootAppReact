import GameTeam from "../../GameTeam";

class GameRoundDTO {

    public id?: number = 0;
    public gameTeam?: GameTeam = new GameTeam();
    public roundNumber?: number = 0;
    public handScore?: number = 0;
    public cleanBooks?: number = 0;
    public dirtyBooks?: number = 0;
    public redThrees?: number = 0;
    public pulledCorrect?: number = 0;
    public isWinner?: boolean = false;

}

export default GameRoundDTO;