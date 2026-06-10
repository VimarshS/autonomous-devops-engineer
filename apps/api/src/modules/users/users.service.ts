import { Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string) {
    const user = await this.db.appUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(id: string, dto: UpdateUserDto) {
    return this.db.appUser.update({
      where: { id },
      data: {
        name: dto.name,
        avatarUrl: dto.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}