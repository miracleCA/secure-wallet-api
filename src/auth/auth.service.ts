import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';


@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,

        @InjectRepository(Wallet)
        private walletRepo: Repository<Wallet>,

        private jwtService: JwtService,
    ) {}

    
    async register(email: string, password: string) {
        const hashed = await bcrypt.hash(password, 12);

        const user = this.userRepo.create({
            email,
            password: hashed,
            role: 'user',
        });

        await this.userRepo.save(user);

        const wallet = this.walletRepo.create({
            user,
            balance: "0.00",
            currency: 'USD',
        });

        await this.walletRepo.save(wallet);

        return this.generateTokens(user);
    }

    async login(email: string, password: string) {
        const user = await this.userRepo.findOne({
            where: { email },
        });

        if (!user) throw new UnauthorizedException();

        const isMatch = await bcrypt.compare(
            password,
            user.password,
        );

        if (!isMatch) throw new UnauthorizedException();

        return this.generateTokens(user);
    }

    async generateTokens(user: User) {

        const payload: { sub: string; email: string; role: string; } = { sub: user.id, email: user.email, role: user.role };

        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET!,
            expiresIn: process.env.JWT_ACCESS_EXPIRES as any, 
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET!, 
            expiresIn: process.env.JWT_REFRESH_EXPIRES as any,
        });

        return { accessToken, refreshToken };
    }
    
}

