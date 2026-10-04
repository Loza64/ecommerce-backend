import { ConflictException } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import {
  Order,
  OrderStatus,
} from 'src/modules/order/domain/entity/order.entity';
import { Coupon } from '../domain/entity/coupon.entity';

export const COUNTED_STATUSES = [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID];

export function countCouponUses(
  manager: EntityManager,
  couponId: number,
  buyerId?: number,
): Promise<number> {
  return manager.count(Order, {
    where: {
      coupon: { id: couponId },
      status: In(COUNTED_STATUSES),
      ...(buyerId ? { buyer: { id: buyerId } } : {}),
    },
  });
}

/** Usos por cupón para una lista de ids (una sola consulta) */
export async function countUsesByCoupon(
  manager: EntityManager,
  couponIds: number[],
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (!couponIds.length) return result;

  const rows = await manager
    .createQueryBuilder(Order, 'o')
    .select('o.coupon_id', 'couponId')
    .addSelect('COUNT(*)', 'uses')
    .where('o.coupon_id IN (:...ids)', { ids: couponIds })
    .andWhere('o.status IN (:...statuses)', { statuses: COUNTED_STATUSES })
    .groupBy('o.coupon_id')
    .getRawMany<{ couponId: number; uses: string }>();

  for (const row of rows) result.set(Number(row.couponId), Number(row.uses));
  return result;
}

/**
 * Verifica los límites de uso del cupón para este comprador.
 * Para evitar carreras se debe llamar dentro de una transacción con el
 * cupón bloqueado (`pessimistic_write`).
 */
export async function assertCouponUsable(
  manager: EntityManager,
  coupon: Pick<Coupon, 'id' | 'maxUses' | 'maxUsesPerUser'>,
  buyerId: number,
): Promise<void> {
  if (coupon.maxUses !== null && coupon.maxUses !== undefined) {
    const total = await countCouponUses(manager, coupon.id);
    if (total >= coupon.maxUses)
      throw new ConflictException('El cupón alcanzó su límite de usos');
  }

  if (coupon.maxUsesPerUser !== null && coupon.maxUsesPerUser !== undefined) {
    const own = await countCouponUses(manager, coupon.id, buyerId);
    if (own >= coupon.maxUsesPerUser)
      throw new ConflictException(
        coupon.maxUsesPerUser === 1
          ? 'Ya usaste este cupón'
          : `Ya usaste este cupón el máximo de veces permitido (${coupon.maxUsesPerUser})`,
      );
  }
}
