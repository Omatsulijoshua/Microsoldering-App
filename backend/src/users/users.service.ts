import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../database/db.service';

@Injectable()
export class UsersService {
  constructor(private dbService: DbService) {}

  findAll() {
    return this.dbService.users.map(({ passwordHash, ...u }) => u);
  }

  findOne(id: string) {
    const user = this.dbService.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { passwordHash, ...result } = user;
    return result;
  }

  update(id: string, updateData: any) {
    const user = this.dbService.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateData.name) user.name = updateData.name;
    if (updateData.role) user.role = updateData.role;
    if (updateData.status) user.status = updateData.status;

    const { passwordHash, ...result } = user;
    return result;
  }

  blockUser(id: string, block: boolean) {
    const user = this.dbService.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    user.status = block ? 'SUSPENDED' : 'ACTIVE';
    const { passwordHash, ...result } = user;
    return result;
  }
}
