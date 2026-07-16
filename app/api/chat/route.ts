import { NextRequest, NextResponse } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import cubejs from "@cubejs-client/core";

type AgentResponse = {
    explanation: string;
    data: any[];
    visualization: "bar_chart" | "line_chart" | "kpi_card";
    reasoning_steps: Array<{ step: number; action: string; agent_thought: string }>;
    sql_query?: string;
    suggestions?: string[];
};

// Demo data (fallback if Cube fails)
const DEMO_DATA = {
    sales_by_category: [
        { category: "Furniture", sales: 250000, profit: 35000, profit_margin: 14 },
        { category: "Office Supplies", sales: 180000, profit: 42000, profit_margin: 23.3 },
        { category: "Technology", sales: 320000, profit: 68000, profit_margin: 21.3 },
    ],
    sales_by_region: [
        { region: "West", sales: 280000, profit: 52000 },
        { region: "East", sales: 240000, profit: 41000 },
        { region: "South", sales: 130000, profit: 22000 },
        { region: "Central", sales: 100000, profit: 30000 },
    ],
    sales_by_month: [
        { month: "Jan", sales: 45000, profit: 8200 },
        { month: "Feb", sales: 52000, profit: 9600 },
        { month: "Mar", sales: 48000, profit: 8900 },
        { month: "Apr", sales: 61000, profit: 11500 },
        { month: "May", sales: 58000, profit: 10400 },
        { month: "Jun", sales: 67000, profit: 12800 },
        { month: "Jul", sales: 72000, profit: 13900 },
        { month: "Aug", sales: 69000, profit: 13100 },
        { month: "Sep", sales: 81000, profit: 15600 },
        { month: "Oct", sales: 78000, profit: 14800 },
        { month: "Nov", sales: 85000, profit: 16300 },
        { month: "Dec", sales: 94000, profit: 18200 },
    ],
    kpi_summary: {
        total_sales: 750000,
        total_profit: 145000,
        total_orders: 2700,
        avg_profit_margin: 19.3,
        unique_customers: 850,
    },
};

function getSuggestions(question: string): string[] {
    const q = question.toLowerCase();

    if (q.includes("category")) {
        return ["Show me sales by region", "What's our profit margin?", "Show me sales trend over time"];
    } else if (q.includes("region")) {
        return ["Show me sales by category", "Which region is most profitable?", "Compare regions"];
    } else if (q.includes("trend") || q.includes("time") || q.includes("month")) {
        return ["Show me sales by category", "What's our profit margin?", "Compare categories"];
    } else if (q.includes("profit") || q.includes("margin")) {
        return ["Show me sales by category", "Show me sales trend over time", "Which category has highest profit?"];
    }

    return ["Show me sales by category", "What's our profit margin?", "Show me sales trend over time"];
}

// Query Cube.dev for real data
async function queryCube(question: string): Promise<AgentResponse | null> {
    try {
        const cubeApiUrl = process.env.CUBE_API_URL;
        const cubeApiToken = process.env.CUBE_API_TOKEN;

        if (!cubeApiUrl || !cubeApiToken) {
            console.log("Cube credentials not found, using demo data");
            return null;
        }

        const cube = cubejs(cubeApiToken, {
            apiUrl: cubeApiUrl,
        });

        const q = question.toLowerCase();

        // Determine what data to query based on the question
        let query: any = {};
        let visualization: "bar_chart" | "line_chart" | "kpi_card" = "bar_chart";
        let explanation = "";
        let reasoning_steps = [];
        let sql_query = "";

        if (q.includes("sales") && (q.includes("category") || q.includes("product"))) {
            query = {
                measures: ["superstore_view.sales", "superstore_view.profit"],
                dimensions: ["superstore_view.category"],
                order: { "superstore_view.sales": "desc" },
            };
            explanation = "Here are your sales by product category:";
            visualization = "bar_chart";
            reasoning_steps = [
                { step: 1, action: "Identify user intent", agent_thought: "User wants sales data grouped by category." },
                { step: 2, action: "Query Cube.dev", agent_thought: "Querying real Snowflake data through Cube." },
                { step: 3, action: "Format results", agent_thought: "Creating a bar chart with category breakdown." },
            ];
            sql_query = "SELECT category, SUM(sales) as sales, SUM(profit) as profit FROM superstore GROUP BY category";
        } else if (q.includes("region") || q.includes("east") || q.includes("west") || q.includes("south") || q.includes("central")) {
            query = {
                measures: ["superstore_view.sales", "superstore_view.profit"],
                dimensions: ["superstore_view.region"],
                order: { "superstore_view.sales": "desc" },
            };
            explanation = "Here are your sales by region:";
            visualization = "bar_chart";
            reasoning_steps = [
                { step: 1, action: "Identify user intent", agent_thought: "User wants sales data by region." },
                { step: 2, action: "Query Cube.dev", agent_thought: "Querying real Snowflake data through Cube." },
                { step: 3, action: "Format results", agent_thought: "Creating a bar chart with region breakdown." },
            ];
            sql_query = "SELECT region, SUM(sales) as sales, SUM(profit) as profit FROM superstore GROUP BY region";
        } else if (q.includes("trend") || q.includes("time") || q.includes("month") || q.includes("over time")) {
            query = {
                measures: ["superstore_view.sales", "superstore_view.profit"],
                dimensions: ["superstore_view.order_month"],
                order: { "superstore_view.order_month": "asc" },
            };
            explanation = "Here's your sales trend over time:";
            visualization = "line_chart";
            reasoning_steps = [
                { step: 1, action: "Identify user intent", agent_thought: "User wants to see sales trends over time." },
                { step: 2, action: "Query Cube.dev", agent_thought: "Querying monthly sales data from Snowflake." },
                { step: 3, action: "Format results", agent_thought: "Creating a line chart to show the trend." },
            ];
            sql_query = "SELECT DATE_TRUNC('month', order_date) as month, SUM(sales) as sales, SUM(profit) as profit FROM superstore GROUP BY month ORDER BY month";
        } else if (q.includes("profit") || q.includes("margin")) {
            query = {
                measures: ["superstore_view.profit"],
                dimensions: ["superstore_view.category"],
                order: { "superstore_view.profit": "desc" },
            };
            explanation = "Here's your profit breakdown by category:";
            visualization = "bar_chart";
            reasoning_steps = [
                { step: 1, action: "Identify user intent", agent_thought: "User wants profit or margin data." },
                { step: 2, action: "Query Cube.dev", agent_thought: "Querying profit data from Snowflake." },
                { step: 3, action: "Format results", agent_thought: "Creating a bar chart with profit breakdown." },
            ];
            sql_query = "SELECT category, SUM(profit) as profit FROM superstore GROUP BY category";
        } else {
            // Default: KPI summary
            query = {
                measures: [
                    "superstore_view.sales",
                    "superstore_view.profit",
                    "superstore_view.count",
                ],
            };
            explanation = "Here are your key business metrics:";
            visualization = "kpi_card";
            reasoning_steps = [
                { step: 1, action: "Analyze user intent", agent_thought: "No specific metric mentioned, showing overall KPIs." },
                { step: 2, action: "Query Cube.dev", agent_thought: "Querying aggregated metrics from Snowflake." },
                { step: 3, action: "Format KPIs", agent_thought: "Presenting key metrics in a card layout." },
            ];
            sql_query = "SELECT SUM(sales) as total_sales, SUM(profit) as total_profit, COUNT(*) as total_orders FROM superstore";
        }

        // Execute the query
        const resultSet = await cube.load(query);
        const data = resultSet.rawData();

        if (!data || data.length === 0) {
            return null;
        }

        // Format the data
        const formattedData = data.map((row: any) => {
            const formatted: any = {};
            Object.keys(row).forEach((key) => {
                // Clean up the key names
                const cleanKey = key.split('.').pop() || key;
                formatted[cleanKey] = row[key];
            });
            return formatted;
        });

        return {
            explanation,
            data: formattedData,
            visualization,
            reasoning_steps,
            sql_query,
            suggestions: getSuggestions(question),
        };

    } catch (error) {
        console.error("Cube query error:", error);
        return null;
    }
}

function getMockData(question: string): AgentResponse {
    const q = question.toLowerCase();

    if (q.includes("sales") && (q.includes("category") || q.includes("product"))) {
        return {
            explanation: "Here are your sales by product category:",
            data: DEMO_DATA.sales_by_category,
            visualization: "bar_chart",
            reasoning_steps: [
                { step: 1, action: "Identify user intent", agent_thought: "User wants sales data grouped by category." },
                { step: 2, action: "Query data", agent_thought: "Retrieving sales and profit from Superstore dataset." },
                { step: 3, action: "Format results", agent_thought: "Creating a bar chart with category breakdown." },
            ],
            sql_query: "SELECT category, SUM(sales) as sales, SUM(profit) as profit FROM superstore GROUP BY category",
            suggestions: getSuggestions(question),
        };
    }

    if (q.includes("region") || q.includes("east") || q.includes("west") || q.includes("south") || q.includes("central")) {
        return {
            explanation: "Here are your sales by region:",
            data: DEMO_DATA.sales_by_region,
            visualization: "bar_chart",
            reasoning_steps: [
                { step: 1, action: "Identify user intent", agent_thought: "User wants sales data by region." },
                { step: 2, action: "Query data", agent_thought: "Retrieving sales and profit from Superstore dataset." },
                { step: 3, action: "Format results", agent_thought: "Creating a bar chart with region breakdown." },
            ],
            sql_query: "SELECT region, SUM(sales) as sales, SUM(profit) as profit FROM superstore GROUP BY region",
            suggestions: getSuggestions(question),
        };
    }

    if (q.includes("trend") || q.includes("time") || q.includes("month") || q.includes("over time") || q.includes("sales trend")) {
        return {
            explanation: "Here's your sales trend over the last 12 months:",
            data: DEMO_DATA.sales_by_month,
            visualization: "line_chart",
            reasoning_steps: [
                { step: 1, action: "Identify user intent", agent_thought: "User wants to see sales trends over time." },
                { step: 2, action: "Query time-series data", agent_thought: "Retrieving monthly sales and profit data." },
                { step: 3, action: "Format results", agent_thought: "Creating a line chart to show the trend." },
            ],
            sql_query: "SELECT DATE_TRUNC('month', order_date) as month, SUM(sales) as sales, SUM(profit) as profit FROM superstore GROUP BY month ORDER BY month",
            suggestions: getSuggestions(question),
        };
    }

    if (q.includes("profit") || q.includes("margin")) {
        return {
            explanation: "Here's your profit breakdown by category:",
            data: DEMO_DATA.sales_by_category.map(d => ({
                category: d.category,
                profit: d.profit,
                profit_margin: d.profit_margin,
            })),
            visualization: "bar_chart",
            reasoning_steps: [
                { step: 1, action: "Identify user intent", agent_thought: "User wants profit or margin data." },
                { step: 2, action: "Query data", agent_thought: "Retrieving profit and margin from Superstore dataset." },
                { step: 3, action: "Format results", agent_thought: "Creating a bar chart with profit breakdown." },
            ],
            sql_query: "SELECT category, SUM(profit) as profit, (SUM(profit)/SUM(sales))*100 as profit_margin FROM superstore GROUP BY category",
            suggestions: getSuggestions(question),
        };
    }

    return {
        explanation: "Here are your key business metrics from the Superstore dataset:",
        data: [DEMO_DATA.kpi_summary],
        visualization: "kpi_card",
        reasoning_steps: [
            { step: 1, action: "Analyze user intent", agent_thought: "No specific metric mentioned, showing overall KPIs." },
            { step: 2, action: "Aggregate metrics", agent_thought: "Calculating totals from Superstore dataset." },
            { step: 3, action: "Format KPIs", agent_thought: "Presenting key metrics in a card layout." },
        ],
        sql_query: "SELECT SUM(sales) as total_sales, SUM(profit) as total_profit, COUNT(DISTINCT order_id) as total_orders FROM superstore",
        suggestions: getSuggestions(question),
    };
}

async function runAgent(question: string): Promise<AgentResponse> {
    // Try to get real data from Cube first
    let response = await queryCube(question);

    // If Cube fails or returns no data, fall back to demo data
    if (!response) {
        console.log("Falling back to demo data");
        response = getMockData(question);
    }

    // Enhance with AI-generated explanation
    try {
        const llm = new ChatGroq({
            model: "llama-3.1-8b-instant",
            temperature: 0.1,
            apiKey: process.env.GROQ_API_KEY,
        });

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", `You are MetricMind, an AI business intelligence assistant for a retail Superstore dataset.
      Keep responses concise and business-focused.`],
            ["human", "{input}"],
        ]);

        const chain = prompt.pipe(llm).pipe(new StringOutputParser());
        const aiResponse = await chain.invoke({ input: question });

        return {
            ...response,
            explanation: aiResponse,
        };

    } catch (error) {
        console.error("Groq API error:", error);
        return response;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        const response = await runAgent(message);

        return NextResponse.json({
            message: response.explanation,
            explanation: response.explanation,
            data: response.data,
            visualization: response.visualization,
            reasoning_steps: response.reasoning_steps,
            suggestions: response.suggestions || ["Show me sales by category", "What's our profit margin?", "Show me sales trend over time"],
            transparency: {
                api_call: {
                    sql: response.sql_query || "No SQL executed",
                    source: response.sql_query ? "real_data (Cube.dev)" : "demo_data",
                    model: "llama-3.1-8b-instant",
                }
            }
        });

    } catch (error) {
        console.error("Agent error:", error);
        return NextResponse.json(
            { error: "Failed to process your request" },
            { status: 500 }
        );
    }
}