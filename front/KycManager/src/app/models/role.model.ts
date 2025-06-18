export class Role {
  name: string;
  type: string; // 'realm' or 'client:<clientId>'
  description?: string;

  constructor(name: string = '', type: string = 'realm', description: string = '') {
    this.name = name;
    this.type = type;
    this.description = description;
  }

  static fromObject(obj: any): Role {
    return new Role(
      obj.name || '',
      obj.type || 'realm',
      obj.description || ''
    );
  }
}
