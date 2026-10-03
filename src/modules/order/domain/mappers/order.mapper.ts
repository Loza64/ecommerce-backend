import { PaginationParser } from 'src/common/parser/pagination.parser';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { fromCents, toCents } from 'src/common/helpers/money';
import { Order } from '../entity/order.entity';
import { OrderItem } from '../entity/order-item.entity';
import {
  OrderItemResponseDto,
  OrderResponseDto,
  SaleResponseDto,
} from '../dto/response.dto';

export class OrderMapper {
  static itemToResponse(item: OrderItem): OrderItemResponseDto {
    return {
      id: item.id,
      productVariantId: item.productVariant?.id ?? null,
      productName: item.productName,
      sku: item.sku,
      attributes: item.attributes,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: fromCents(toCents(item.unitPrice) * item.quantity),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    };
  }

  static toResponse(order: Order): OrderResponseDto {
    return {
      id: order.id,
      status: order.status,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      total: order.total,
      currency: order.currency,
      couponCode: order.couponCode,
      paidAt: order.paidAt,
      items: [...(order.items ?? [])]
        .sort((a, b) => a.id - b.id)
        .map((i) => this.itemToResponse(i)),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deletedAt: order.deletedAt,
    };
  }

  static saleToResponse(item: OrderItem): SaleResponseDto {
    return {
      ...this.itemToResponse(item),
      order: {
        id: item.order.id,
        status: item.order.status,
        paidAt: item.order.paidAt,
        buyer: item.order.buyer
          ? {
              id: item.order.buyer.id,
              username: item.order.buyer.username,
              name: item.order.buyer.name,
            }
          : null,
      },
    };
  }

  static toPaginatedResponse(
    pagination: PaginationParser<Order>,
  ): PaginatedResponseDto<OrderResponseDto> {
    return new PaginatedResponseDto(
      pagination.data.map((o) => this.toResponse(o)),
      pagination.pagination,
    );
  }

  static toPaginatedSales(
    pagination: PaginationParser<OrderItem>,
  ): PaginatedResponseDto<SaleResponseDto> {
    return new PaginatedResponseDto(
      pagination.data.map((i) => this.saleToResponse(i)),
      pagination.pagination,
    );
  }
}
