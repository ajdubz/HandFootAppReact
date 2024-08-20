

class PlayerCreateDTO {
    
    public nickname: string;
    public email: string;
    public password: string;

    constructor(Nickname: string, Email: string, Password: string) {
        this.nickname = Nickname;
        this.email = Email;
        this.password = Password;
    }
}

export default PlayerCreateDTO;