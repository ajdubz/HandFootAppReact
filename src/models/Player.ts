import { Team } from './Team';

export class Player {
  id: number;
  nickName: string;
  email: string;
  password: string;
  team: Team;
  friends?: Player[];

  constructor(
    id: number,
    name: string,
    email: string,
    password: string,
    team: Team = new Team(0, ''),
    friends: Player[] = []
  ) {
    this.id = id;
    this.nickName = name;
    this.email = email;
    this.password = password;
    this.team = team;
    this.friends = friends;
  }
}
