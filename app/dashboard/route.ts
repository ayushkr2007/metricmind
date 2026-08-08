import { NextResponse } from 'next/server';

export async function GET() {
    const mockData = {
        kpis: {
            total_sales: 750000,
            total_profit: 145000,
            total_orders: 2700,
            avg_profit_margin: 19.3,
        },
        sales_by_category: [
            { category: "Furniture", sales: 250000, profit: 35000 },
            { category: "Office Supplies", sales: 180000, profit: 42000 },
            { category: "Technology", sales: 320000, profit: 68000 },
        ],
        sales_by_region: [
            { region: "West", sales: 280000, profit: 52000 },
            { region: "East", sales: 240000, profit: 41000 },
            { region: "South", sales: 130000, profit: 22000 },
            { region: "Central", sales: 100000, profit: 30000 },
        ],
        sales_trend: [
            { month: "Jan", sales: 45000 }, { month: "Feb", sales: 52000 },
            { month: "Mar", sales: 48000 }, { month: "Apr", sales: 61000 },
            { month: "May", sales: 58000 }, { month: "Jun", sales: 67000 },
            { month: "Jul", sales: 72000 }, { month: "Aug", sales: 69000 },
            { month: "Sep", sales: 81000 }, { month: "Oct", sales: 78000 },
            { month: "Nov", sales: 85000 }, { month: "Dec", sales: 94000 },
        ]
    };
    return NextResponse.json(mockData);
}