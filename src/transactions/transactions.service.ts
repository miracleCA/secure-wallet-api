import { BadRequestException, Injectable } from '@nestjs/common';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Wallet } from '../../src/wallets/entities/wallet.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class TransactionsService {

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,

        @InjectRepository(Transaction)
        private readonly transactionRepo: Repository<Transaction>,

        @InjectRepository(Wallet)
        private readonly walletRepo: Repository<Wallet>
    ) {}


    async create(dto: CreateTransactionDto, userId: string) {

        const qr = this.dataSource.createQueryRunner();

        await qr.connect();
        await qr.startTransaction();

        try {
            const amount = Number(dto.amount);

            if (Number.isNaN(amount)) throw new BadRequestException("Invalid amount");

            if (amount <= 0) throw new BadRequestException("Amount must be greater than zero");

            const existing = await qr.manager.findOne(Transaction, {
                where: { idempotencyKey: dto.idempotencyKey },
            });

            if (existing) return existing;

            const wallet = await qr.manager.findOne(Wallet, {
                where: { userId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!wallet) throw new Error('Wallet not found');

            const balance = Number(wallet.balance);

            if (dto.type === 'debit' && balance < dto.amount) {
                throw new Error('Insufficient balance');
            }

            wallet.balance =
                dto.type === 'debit'
                    ? (balance - dto.amount).toFixed(2)
                    : (balance + dto.amount).toFixed(2);

            await qr.manager.save(wallet);


            const tx = qr.manager.create(Transaction, {
                wallet,
                type: dto.type,
                amount: dto.amount,
                status: 'success',
                reference: crypto.randomUUID(),
                idempotencyKey: dto.idempotencyKey,
            });


            await qr.manager.save(tx);

            await qr.commitTransaction();

            return tx
            

        } catch (e) {
            await qr.rollbackTransaction();
            throw e;
        } finally {
            await qr.release();
        }
    }

    async findTransactionsByUser(userId: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 20 } = paginationDto;
        const skip = (page - 1) * limit;

        const wallet = await this.walletRepo.findOne({
            where: {
                user: { id: userId },
            },
            relations: {
                user: true,
            },
        });

        const transactions = await this.transactionRepo.find({
            where: {
                wallet: { id: wallet!.id },
            },
            relations: {
                wallet: true,
            },
        });

        const transactionsCount = await this.transactionRepo.count({
            where: {
                wallet: { id: wallet!.id },
            },
            relations: {
                wallet: true,
            },
        });

        const paginatedData = transactions.slice(skip, skip + Number(limit));

        return {
            paginatedData,
            pagination: {
                total: transactionsCount,
                page,
                limit,
                totalPages: Math.ceil(transactionsCount / limit),
            },
        };
    }

}


