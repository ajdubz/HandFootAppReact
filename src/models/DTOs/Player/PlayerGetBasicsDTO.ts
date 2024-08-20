import TeamGetBasicDTO from "../Team/TeamGetBasicDTO";


class PlayerGetBasicDTO {
    id: number;
    nickName?: string;
    team?: TeamGetBasicDTO;

    constructor(id: number, nickName: string, team: TeamGetBasicDTO) {
        this.id = id;
        this.nickName = nickName;
        this.team = team;
    }

}

export default PlayerGetBasicDTO;