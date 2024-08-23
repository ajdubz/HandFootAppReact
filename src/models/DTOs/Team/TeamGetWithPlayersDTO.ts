import PlayerGetBasicDTO from "../Player/PlayerGetBasicDTO";

class TeamGetWithPlayersDTO {

    id?: number = 0;
    name?: string = '';
    players?: PlayerGetBasicDTO[] = [];

}

export default TeamGetWithPlayersDTO;