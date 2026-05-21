import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { PaginationDto } from './dto/pagination.dto';

@Controller('transactions')
export class TransactionsController {

    constructor(
        private readonly transactionsService: TransactionsService
    ) {}


    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: CreateTransactionDto, @Req() req) {
        return this.transactionsService.create(dto, req.user.userId);
    }

    
    @UseGuards(JwtAuthGuard)
    @Get()
    getTransactions(@Query() paginationDto: PaginationDto, @Req() req) {
        return this.transactionsService.findTransactionsByUser(req.user.userId, paginationDto);
    }

}