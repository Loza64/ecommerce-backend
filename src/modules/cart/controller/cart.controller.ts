import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Profile } from 'src/common/decorators/profile';
import { User } from 'src/modules/user/domain/entity/user.entity';
import { ApplyCouponDto } from 'src/modules/coupon/domain/dto/payload.dto';
import { CartService } from '../service/cart.service';
import { CartMapper } from '../domain/mappers/cart.mapper';
import { CartResponseDto } from '../domain/dto/response.dto';
import { AddCartItemDto, UpdateCartItemDto } from '../domain/dto/payload.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async get(@Profile() profile: User): Promise<CartResponseDto> {
    return CartMapper.toResponse(
      await this.cartService.getOrCreateActive(profile.id),
    );
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async clear(@Profile() profile: User): Promise<CartResponseDto> {
    return CartMapper.toResponse(await this.cartService.clear(profile.id));
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addItem(
    @Body() dto: AddCartItemDto,
    @Profile() profile: User,
  ): Promise<CartResponseDto> {
    return CartMapper.toResponse(
      await this.cartService.addItem(profile.id, dto),
    );
  }

  @Patch('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async updateItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto,
    @Profile() profile: User,
  ): Promise<CartResponseDto> {
    return CartMapper.toResponse(
      await this.cartService.updateItemQuantity(
        profile.id,
        itemId,
        dto.quantity,
      ),
    );
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async removeItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Profile() profile: User,
  ): Promise<CartResponseDto> {
    return CartMapper.toResponse(
      await this.cartService.removeItem(profile.id, itemId),
    );
  }

  @Post('coupon')
  @HttpCode(HttpStatus.OK)
  async applyCoupon(
    @Body() dto: ApplyCouponDto,
    @Profile() profile: User,
  ): Promise<CartResponseDto> {
    return CartMapper.toResponse(
      await this.cartService.applyCoupon(profile.id, dto.code),
    );
  }

  @Delete('coupon')
  @HttpCode(HttpStatus.OK)
  async removeCoupon(@Profile() profile: User): Promise<CartResponseDto> {
    return CartMapper.toResponse(
      await this.cartService.removeCoupon(profile.id),
    );
  }
}
