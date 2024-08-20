import { Team } from './Team';

export class Player {
  id: number = 0;
  nickName?: string = '';
  email?: string = '';
  password?: string = '';
  team?: Team = new Team();
  friends?: Player[] = [];

}
