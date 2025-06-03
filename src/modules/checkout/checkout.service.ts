import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checkout, CheckoutStatus } from 'src/entities/checkout.entity';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { User } from 'src/entities/user.entity';
import { Food } from 'src/entities/food.entity';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Checkout)
    private readonly checkoutRepository: Repository<Checkout>,
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
  ) {}

  async createCheckout(
    user: User,
    createCheckoutDto: CreateCheckoutDto,
  ): Promise<Checkout> {
    const food = await this.foodRepository.findOne({
      where: { id: createCheckoutDto.foodId },
    });

    if (!food) {
      throw new NotFoundException('Food not found');
    }

    const checkout = this.checkoutRepository.create({
      ...createCheckoutDto,
      userId: user.id,
      status: createCheckoutDto.status || CheckoutStatus.PENDING,
    });

    return this.checkoutRepository.save(checkout);
  }

  async getCheckoutById(id: string, user: User): Promise<Checkout> {
    const checkout = await this.checkoutRepository.findOne({
      where: { id, userId: user.id },
      relations: ['course'],
    });

    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    return checkout;
  }

  async updateCheckoutStatus(
    id: string,
    status: CheckoutStatus,
    paymentIntentId?: string,
  ): Promise<Checkout> {
    const checkout = await this.checkoutRepository.findOne({
      where: { id },
    });

    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    checkout.status = status;
    if (paymentIntentId) {
      checkout.paymentIntentId = paymentIntentId;
    }

    return this.checkoutRepository.save(checkout);
  }

  async getUserCheckouts(user: User): Promise<Checkout[]> {
    return this.checkoutRepository.find({
      where: { userId: user.id },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
  }
}
