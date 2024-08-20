
class PlayerUpdateDTO {

    public id: number;
    public nickName: string;
    public email: string;
    public teamId: number;
    
    constructor(id: number, nickName: string, Email: string, teamId: number) {
        this.id = id;
        this.nickName = nickName;
        this.email = Email;
        this.teamId = teamId;
    }
}

export default PlayerUpdateDTO;