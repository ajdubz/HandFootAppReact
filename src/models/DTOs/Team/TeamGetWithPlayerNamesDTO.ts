import PlayerGetBasicDTO from "../Player/PlayerGetBasicDTO";

class TeamGetWithPlayerNamesDTO {
    
    id?: number = 0;
    name?: string = '';
    teamMembers?: PlayerGetBasicDTO[] = [];

}

export default TeamGetWithPlayerNamesDTO;