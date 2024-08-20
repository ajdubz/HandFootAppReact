import PlayerGetBasicDTO from "../Player/PlayerGetBasicsDTO";

class TeamGetWithPlayersDTO {

    id?: number = 0;
    name?: string = '';
    players?: PlayerGetBasicDTO[] = [];

}

export default TeamGetWithPlayersDTO;