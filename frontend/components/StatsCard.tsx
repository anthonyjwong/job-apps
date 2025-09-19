"use client";

import { Brain, ChevronRight, LucideIcon, Star, Target, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  iconName: "target" | "users" | "brain" | "zap" | "star" | "trending-up";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  // Legacy props for backward compatibility
  subtitle?: string;
  count?: string | number;
  color?: "yellow" | "blue";
}

const ICONS: Record<NonNullable<StatsCardProps["iconName"]>, LucideIcon> = {
  target: Target,
  users: Users,
  brain: Brain,
  zap: Zap,
  star: Star,
  "trending-up": TrendingUp,
};

export function StatsCard({ title, value, iconName, trend, onClick, subtitle, count, color }: StatsCardProps) {
  // Legacy support
  if (subtitle && count !== undefined && color) {
    const colorClasses = {
      yellow: "bg-yellow-400 text-black",
      blue: "bg-blue-400 text-white",
    };

    return (
      <div
        className={`${colorClasses[color]} rounded-lg p-6 cursor-pointer transition-transform hover:scale-105`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium mb-1">{title}</h3>
            <div className="text-sm opacity-90 flex items-center gap-1">
              {subtitle}
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="text-2xl font-medium">{count}</div>
        </div>
      </div>
    );
  }

  // New analytics design
  const IconComp = ICONS[iconName] ?? undefined;
  return (
    <Card 
      className={`${onClick ? 'cursor-pointer hover:bg-muted/50' : ''} transition-colors`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {IconComp ? <IconComp className="w-4 h-4 text-primary" /> : null}
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-medium">{value}</p>
              {trend && (
                <div className={`flex items-center gap-1 text-xs ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}