
class TeamGetBasicDTO {
    
    id: number;
    name?: string;

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }

}

export default TeamGetBasicDTO;