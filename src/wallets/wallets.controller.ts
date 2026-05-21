import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { WalletsService } from './wallets.service';

@Controller('wallets')
export class WalletsController {

    constructor(
        private readonly walletService: WalletsService
    ) {} 


    @UseGuards(JwtAuthGuard)
    @Get()
    getWallet(@Req() req) {
        return this.walletService.findByUser(req.user.userId);
    }
}