export function sumRevenueAndCost(sales: { salePrice: unknown; costPrice: unknown }[]) {
  const revenue = sales.reduce((sum, s) => sum + Number(s.salePrice), 0);
  const cost = sales.reduce((sum, s) => sum + Number(s.costPrice), 0);
  return { revenue, cost, profit: revenue - cost };
}
