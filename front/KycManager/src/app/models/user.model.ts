export class User {
  id: string;
  username: string;
  email?: string;
  selected: boolean;

  constructor(
    id: string = '',
    username: string = '',
    email: string = '',
    selected: boolean = false
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.selected = selected;
  }
}
