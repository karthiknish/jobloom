"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TimeSeriesPoint } from "@/utils/api/analytics";

interface AdminChartProps {
  data: TimeSeriesPoint[];
  title: string;
  description?: string;
}

const userChartConfig = {
  signups: {
    label: "New Users",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function UserGrowthChart({ data, title, description }: AdminChartProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <ChartContainer config={userChartConfig} className="h-[300px] w-full">
        <AreaChart
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            hide
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Area
            dataKey="signups"
            type="natural"
            fill="var(--color-signups)"
            fillOpacity={0.4}
            stroke="var(--color-signups)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

const activityChartConfig = {
  applications: {
    label: "Applications",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function ApplicationActivityChart({ data, title, description }: AdminChartProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <ChartContainer config={activityChartConfig} className="h-[300px] w-full">
        <AreaChart
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            hide
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Area
            dataKey="applications"
            type="natural"
            fill="var(--color-applications)"
            fillOpacity={0.4}
            stroke="var(--color-applications)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function RevenueTrendChart({ data, title, description }: AdminChartProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
        <AreaChart
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `£${value}`}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent 
                indicator="dot" 
                formatter={(value) => `£${Number(value).toLocaleString()}`} 
              />
            }
          />
          <Area
            dataKey="revenue"
            type="natural"
            fill="var(--color-revenue)"
            fillOpacity={0.4}
            stroke="var(--color-revenue)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
