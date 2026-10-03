import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import BaseQuerys from 'src/common/dto/base-querys.dto';
import { Profile } from 'src/common/decorators/profile';
import { User } from 'src/modules/user/domain/entity/user.entity';
import { Idempotent } from 'src/shared/idempotency/idempotent.decorator';
import { OrderService } from '../service/order.service';
import { OrderMapper } from '../domain/mappers/order.mapper';
import { OrderQuerys } from '../domain/dto/querys';
import {
  CheckoutResponseDto,
  OrderResponseDto,
} from '../domain/dto/response.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Convierte el carrito en un pedido y crea el pago en Stripe.
   * Requiere el header `Idempotency-Key`.
   */
  @Post('checkout')
  @Idempotent()
  @HttpCode(HttpStatus.CREATED)
  async checkout(@Profile() profile: User): Promise<CheckoutResponseDto> {
    const { order, clientSecret } = await this.orderService.checkout(profile);
    return { order: OrderMapper.toResponse(order), clientSecret };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findMine(@Query() query: OrderQuerys, @Profile() profile: User) {
    const result = await this.orderService.findMine({
      userId: profile.id,
      status: query.status,
      page: query.page,
      size: query.pageSize,
    });
    return OrderMapper.toPaginatedResponse(result);
  }

  /** Lo que he vendido (como vendedor) */
  @Get('sales')
  @HttpCode(HttpStatus.OK)
  async findSales(@Query() query: BaseQuerys, @Profile() profile: User) {
    const result = await this.orderService.findSales({
      sellerId: profile.id,
      page: query.page,
      size: query.pageSize,
    });
    return OrderMapper.toPaginatedSales(result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Profile() profile: User,
  ): Promise<OrderResponseDto> {
    return OrderMapper.toResponse(
      await this.orderService.findOneOwned(id, profile.id),
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Profile() profile: User,
  ): Promise<OrderResponseDto> {
    return OrderMapper.toResponse(
      await this.orderService.cancelByBuyer(id, profile.id),
    );
  }
}
