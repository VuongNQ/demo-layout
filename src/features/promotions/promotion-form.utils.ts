import type { Promotion } from './demo-promotions-data';

export type PromotionFormValues = Omit<Promotion, 'id'>;

export function getPromotionFormValues(promotion: Promotion): PromotionFormValues {
  return {
    name: promotion.name,
    code: promotion.code,
    offerType: promotion.offerType,
    startDate: promotion.startDate,
    endDate: promotion.endDate,
    status: promotion.status,
    assignedProducts: [...promotion.assignedProducts]
  };
}

export function copyPromotionFormValues(values: PromotionFormValues): PromotionFormValues {
  return { ...values, assignedProducts: [...values.assignedProducts] };
}

export function arePromotionFormValuesEqual(left: PromotionFormValues, right: PromotionFormValues): boolean {
  return left.name === right.name
    && left.code === right.code
    && left.offerType === right.offerType
    && left.startDate === right.startDate
    && left.endDate === right.endDate
    && left.status === right.status
    && left.assignedProducts.length === right.assignedProducts.length
    && left.assignedProducts.every((product, index) => product === right.assignedProducts[index]);
}
