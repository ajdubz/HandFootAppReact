
class TeamCreateDTO {
    public id: number;
    public name: string;
    public players: number[];

    constructor(Id: number, Name: string, Players: number[]) {
        this.id = Id;
        this.name = Name;
        this.players = Players;
    }
}

export default TeamCreateDTO;