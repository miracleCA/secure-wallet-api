import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';

@Injectable()
export class WalletsService {
    constructor(
        @InjectRepository(Wallet)
        private readonly walletRepo: Repository<Wallet>,
    ) { }

    async findByUser(userId: string) {
        return this.walletRepo.findOne({
            where: {
                user: { id: userId },
            },
            relations: {
                user: true,
            },
        });
    }
}