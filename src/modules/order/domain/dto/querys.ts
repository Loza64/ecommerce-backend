import { IsEnum, IsOptional } from 'class-validator';
import BaseQuerys from 'src/common/dto/base-querys.dto';
import { OrderStatus } from '../entity/order.entity';

export class OrderQuerys extends BaseQuerys {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
