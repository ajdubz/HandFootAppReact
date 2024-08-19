import TeamGetBasicDTO from "../Team/TeamGetBasicDTO";


class PlayerGetBasicDTO {
    Id: number;
    NickName?: string;
    Team?: TeamGetBasicDTO;

    constructor(id: number, nickName: string, team: TeamGetBasicDTO) {
        this.Id = id;
        this.NickName = nickName;
        this.Team = team;
    }

}

export default PlayerGetBasicDTO;