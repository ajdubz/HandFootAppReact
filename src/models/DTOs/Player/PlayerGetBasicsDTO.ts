import TeamGetBasicDTO from "../Team/TeamGetBasicDTO";

class PlayerGetBasicDTO {
    id?: number = 0;
    nickName?: string = '';
    team?: TeamGetBasicDTO = new TeamGetBasicDTO();

}

export default PlayerGetBasicDTO;