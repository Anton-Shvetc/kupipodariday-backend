import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { hash } from '../utils/bcrypt.helpers';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async checkUserExists(email: string, username: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Пользователь с таким email уже зарегистрирован');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Пользователь с таким username уже зарегистрирован');
      }
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      await this.checkUserExists(createUserDto.email, createUserDto.username);
      
      const hashedPassword = await hash(createUserDto.password);
      const createdUser = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });
      
      const savedUser = await this.userRepository.save(createdUser);
      delete savedUser.password;
      return savedUser;
    } catch (err) {
      if (err instanceof ConflictException) {
        throw err;
      }
      throw new Error(`Ошибка при создании пользователя: ${err.message}`);
    }
  }

  async findUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    delete user.password;
    return user;
  }

  async findUserByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ username });
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    return user;
  }

  async findManyUsers(user): Promise<User[]> {
    const users = await this.userRepository.find({
      where: [{ email: user.query }, { username: user.query }],
    });
    users.forEach((user) => {
      delete user.password;
    });
    return users;
  }

  async updateUserById(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    try {
      const user = await this.findUserById(id);
      
      // Проверяем, изменяются ли email или username
      if (updateUserDto.email || updateUserDto.username) {
        await this.checkUserExists(
          updateUserDto.email ?? user.email,
          updateUserDto.username ?? user.username
        );
      }

      const hashedPassword = updateUserDto.password 
        ? await hash(updateUserDto.password)
        : user.password;

      const updatedUser = {
        ...user,
        password: hashedPassword,
        email: updateUserDto.email ?? user.email,
        about: updateUserDto.about ?? user.about,
        username: updateUserDto.username ?? user.username,
        avatar: updateUserDto.avatar ?? user.avatar,
      };
      
      await this.userRepository.update(user.id, updatedUser);
      const result = await this.findUserById(id);
      return result;
    } catch (err) {
      if (err instanceof ConflictException) {
        throw err;
      }
      throw new Error(`Ошибка при обновлении пользователя: ${err.message}`);
    }
  }
}