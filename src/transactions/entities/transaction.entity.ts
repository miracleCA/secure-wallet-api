import { Wallet } from '../../wallets/entities/wallet.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  reference: string;
  

  @ManyToOne(() => Wallet, { eager: false })
  @JoinColumn()
  wallet: Wallet;

  @Column({
    type: 'enum',
    enum: ['credit', 'debit'],
  })
  type: string;


  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  })
  status: string;

  @Index({ unique: true })
  @Column()
  idempotencyKey: string;

  @CreateDateColumn()
  createdAt: Date;
}

