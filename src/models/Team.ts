
export class Team {
    id: number;
    name: string;
    PlayerIds: number[];
    
    constructor(id: number, name: string, players: number[] = []) {
        this.id = id;
        this.name = name;
        this.PlayerIds = players;
    }
}