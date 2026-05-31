export interface IRecentPurchase {
  id: string;
  supplierName: string;
  totalAmount: number;
  status: string;
  date: string;
}

export interface IStockAlert {
  productId: string;
  productName: string;
  productCode: string;
  currentStock: number;
  unitType: string;
}

export interface ISalesChartPoint {
  dateLabel: string;
  totalSales: number;
  mySales: number;
}

export interface IDashboardStats {
  totalSalesRevenue: number;
  totalSalesCount: number;
  avgSaleValue: number;
  mySalesRevenue: number;
  mySalesCount: number;
  myAvgSaleValue: number;
  recentPurchases: IRecentPurchase[];
  stockAlerts: IStockAlert[];
  salesChartData: ISalesChartPoint[];
}
