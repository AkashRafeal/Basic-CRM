export interface SalesLeaderboardItem {
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
  rank: number;
  closedWonRevenue: number;
  activePipelineValue: number;
  dealsWon: number;
  activeDeals: number;
  touchpointsCompleted: number;
  tasksCompleted: number;
  taskCompletionRate: number;
}

export interface ExecutiveSummaryReport {
  generatedAt: string;
  totalPipelineValue: number;
  weightedForecastValue: number;
  recognizedCustomerArr: number;
  totalProspectLeadValue: number;
  totalDeals: number;
  activeDeals: number;
  wonDeals: number;
  winRate: number;
  totalCustomers: number;
  activeCustomers: number;
  totalLeads: number;
  leadConversionRate: number;
  totalTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  followUpsToday: number;
  followUpSuccessRate: number;
  topPerformers: SalesLeaderboardItem[];
}

export interface SalesPerformanceReport {
  totalPipelineValue: number;
  weightedForecastValue: number;
  closedWonRevenue: number;
  closedLostValue: number;
  averageDealSize: number;
  winRate: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  activeDeals: number;
  dealsByStage: Record<string, number>;
  revenueByStage: Record<string, number>;
  dealsByType: Record<string, number>;
  revenueByType: Record<string, number>;
  lossReasonsPareto: Record<string, number>;
}

export interface TeamLeaderboardReport {
  totalReps: number;
  teamTotalRevenue: number;
  teamActivePipeline: number;
  teamDealsWon: number;
  teamTouchpointsCompleted: number;
  leaderboard: SalesLeaderboardItem[];
}

export interface LeadSourceMetric {
  source: string;
  sourceDisplayName: string;
  leadCount: number;
  convertedCount: number;
  conversionRate: number;
  totalValue: number;
}

export interface LeadSourceReport {
  totalLeads: number;
  convertedLeads: number;
  overallConversionRate: number;
  totalEstimatedValue: number;
  sourceMetrics: LeadSourceMetric[];
}

export interface IndustryMetric {
  industry: string;
  industryDisplayName: string;
  customerCount: number;
  totalArr: number;
  revenueSharePercent: number;
}

export interface CustomerIndustryReport {
  totalCustomers: number;
  totalAnnualRevenue: number;
  averageCustomerArr: number;
  overallRetentionRate: number;
  industryMetrics: IndustryMetric[];
  tierBreakdown: Record<string, number>;
  tierRevenue: Record<string, number>;
}

export interface ProductMetricItem {
  productId: number;
  productName: string;
  sku?: string;
  category?: string;
  unitPrice: number;
  status: string;
  isPhysical?: boolean;
  interestedLeadsCount: number;
  totalDealsCount: number;
  wonDealsCount: number;
  pipelineValue: number;
  closedWonRevenue: number;
  activeCustomersCount: number;
  conversionRate: number;
}

export interface ProductPerformanceReport {
  totalProducts: number;
  activeProducts: number;
  totalProductRevenue: number;
  totalProductPipelineValue: number;
  products: ProductMetricItem[];
  topRevenueProducts: ProductMetricItem[];
  topInterestedProducts: ProductMetricItem[];
}
