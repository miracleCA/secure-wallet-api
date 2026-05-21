import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { JwtStrategy } from './strategies/jwt.strategy';



@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet]), 

    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET, 
      signOptions: { expiresIn: '15m' }, 
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy]
  
})
export class AuthModule {}