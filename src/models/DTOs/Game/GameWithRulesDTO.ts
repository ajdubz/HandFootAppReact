import Rules from "../../Rules";

class GameWithRulesDTO {
    public id: number = 0;
    public date: Date = new Date();
    public rules: Rules = new Rules();
}

export default GameWithRulesDTO;