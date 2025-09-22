"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type WeeklyInterviewRate = { week: string; safety: number; target: number; reach: number; dream: number };
export type InterviewFunnelStep = { stage: string; count: number; percentage: number };
export type ApplicationTrendPoint = { month: string; applications: number; interviews: number; offers: number };

export function InterviewRateTrendsChart({ data }: { data: WeeklyInterviewRate[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="week"
          tick={{ fill: "hsl(var(--foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <YAxis
          tick={{ fill: "hsl(var(--foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Line type="monotone" dataKey="safety" stroke="hsl(var(--safety))" strokeWidth={2} dot={{ fill: "hsl(var(--safety))" }} />
        <Line type="monotone" dataKey="target" stroke="hsl(var(--target))" strokeWidth={2} dot={{ fill: "hsl(var(--target))" }} />
        <Line type="monotone" dataKey="reach" stroke="hsl(var(--reach))" strokeWidth={2} dot={{ fill: "hsl(var(--reach))" }} />
        <Line type="monotone" dataKey="dream" stroke="hsl(var(--dream))" strokeWidth={2} dot={{ fill: "hsl(var(--dream))" }} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function InterviewFunnelChart({ data }: { data: InterviewFunnelStep[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" tick={{ fill: "hsl(var(--foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} />
        <YAxis type="classification" dataKey="stage" tick={{ fill: "hsl(var(--foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(value: any) => {
            const step = data.find((m) => m.count === value);
            return [`${value} (${step?.percentage ?? 0}%)`, "Count"] as any;
          }}
        />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ApplicationTrendsChart({ data }: { data: ApplicationTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tick={{ fill: "hsl(var(--foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} />
        <YAxis tick={{ fill: "hsl(var(--foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Area type="monotone" dataKey="applications" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
        <Area type="monotone" dataKey="interviews" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
        <Area type="monotone" dataKey="offers" stackId="3" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.6} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
