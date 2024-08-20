import PlayerGetBasicDTO from "../Player/PlayerGetBasicsDTO";

class TeamGetWithPlayersDTO {
    id: number;
    name: string;
    players: PlayerGetBasicDTO[];

    constructor(id: number, name: string, players: PlayerGetBasicDTO[]) {
        this.id = id;
        this.name = name;
        this.players = players;
    }

}

export default TeamGetWithPlayersDTO;