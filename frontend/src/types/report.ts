export type ReportPeriod =
    | "today"
    | "yesterday"
    | "this_week"
    | "this_month"
    | "custom";

export interface DashboardFilters {
    period: ReportPeriod;
    from: string;
    to: string;
}

export interface SalesSummary {
    transaction_count: number;
    total_sales: number;
    total_cogs: number;
    gross_profit: number;
    gross_margin: number;
}

export interface InventorySummary {
    transaction_count: number;
    total_in: number;
    total_out: number;
    net_movement: number;
    purchases: number;
    sales: number;
    refunds: number;
    voids: number;
    bad_orders: number;
    adjustment_in: number;
    adjustment_out: number;
}

export interface TopSellingProduct {
    product_id: number;
    product_name: string;
    sku: string;
    quantity_sold: number;
    total_sales: number;
    total_cogs: number;
    gross_profit: number;
}

export interface LowStockProduct {
    product_id: number;
    product_name: string;
    sku: string;
    unit: string;
    current_stock: number;
    minimum_stock: number;
    status: "low_stock" | "out_of_stock";
}

export interface VoidRefund {
    sale_id: number;
    sale_number: string;
    invoice_number: string | null;
    status: "voided" | "refunded";
    action: "void" | "refund";
    customer: string | null;
    user: string | null;
    sale_date: string;
    action_date: string;
    total: number;
    notes: string | null;
    items: Array<{
        sale_item_id: number;
        product_id: number;
        product_name: string | null;
        sku: string | null;
        quantity: number;
        unit_price: number;
        total: number;
        cogs: number;
        gross_profit: number;
    }>;
}

export interface DashboardData {
    sales: SalesSummary;
    inventory: InventorySummary;
    low_stock: LowStockProduct[];
    top_products: TopSellingProduct[];
    void_refund: VoidRefund[];
}

export interface DashboardResponse {
    message: string;
    filters: DashboardFilters;
    data: DashboardData;
}

export interface SalesTrendItem {
    date: string;
    sales: number;
    transaction_count: number;
}

export interface SalesTrendResponse {
    message: string;

    filters: {
        period: ReportPeriod;
        from: string;
        to: string;
    };

    data: SalesTrendItem[];
}

