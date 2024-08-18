import { Team } from './Team';

export class Player {
  nickName: string;
  email: string;
  password: string;
  team: Team;
  id: number;
  friends: Player[];

  constructor(
    name: string,
    email: string,
    password: string,
    id: number,
    team: Team = new Team(0, ''),
    friends: Player[] = []
  ) {
    this.nickName = name;
    this.email = email;
    this.password = password;
    this.team = team;
    this.id = id;
    this.friends = friends;
  }
}
