

class PlayerAccountDTO {
    
    public id?: number = 0;
    public nickName?: string = '';
    public fullName?: string = '';
    public email?: string = '';
    public password?: string = '';
    public isGuest?: boolean = false;
    public publicTag?: string = '';

}

export default PlayerAccountDTO;
