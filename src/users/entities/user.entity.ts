import { Entity, Column, OneToMany } from 'typeorm';
import { DefaultEntity } from '../../utils/default.entity';
import {
  IsEmail,
  IsEmpty,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

@Entity()
export class User extends DefaultEntity {
  @Column({ unique: true })
  @IsString()
  @IsNotEmpty()
  @Length(2, 30, { message: 'Минимум 2 символа, максимум 30 символов' })
  username: string;

  @Column({ default: 'Пока тут пусто' })
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Максимум 200 символов' })
  about: string;

  @Column({ unique: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column()
  @IsString()
  @MinLength(6, { message: 'Минимум 6 символов' })
  password: string;

  @Column({ default: 'https://i.pravatar.cc/150' })
  @IsUrl()
  @IsOptional()
  avatar: string;
}
