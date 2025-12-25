"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
  color?: "primary" | "success" | "warning" | "danger";
  showPoints?: boolean;
  showArea?: boolean;
  showTooltip?: boolean;
  labels?: string[];
}

export function Sparkline({
  data,
  width = 200,
  height = 50,
  strokeWidth = 2,
  className,
  color = "primary",
  showPoints = true,
  showArea = true,
  labels,
}: SparklineProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 10;

    // Normalize points
    const points = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * (width - padding * 2),
      y: height - padding - ((value - min) / range) * (height - padding * 2),
      value,
      label: labels?.[index],
    }));

    // Create path for line
    const linePath = points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");

    // Create path for area fill
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    // Determine trend
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const trend = lastValue > firstValue ? "up" : lastValue < firstValue ? "down" : "neutral";

    return { points, linePath, areaPath, trend };
  }, [data, width, height, labels]);

  if (!chartData) {
    return (
      <div 
        className={cn("flex items-center justify-center text-muted-foreground", className)}
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  const colorMap = {
    primary: {
      stroke: "stroke-primary",
      fill: "fill-primary/10",
      point: "fill-primary",
      gradient: ["rgba(16, 185, 129, 0.3)", "rgba(16, 185, 129, 0)"]
    },
    success: {
      stroke: "stroke-green-500",
      fill: "fill-green-500/10",
      point: "fill-green-500",
      gradient: ["rgba(34, 197, 94, 0.3)", "rgba(34, 197, 94, 0)"]
    },
    warning: {
      stroke: "stroke-amber-500",
      fill: "fill-amber-500/10",
      point: "fill-amber-500",
      gradient: ["rgba(245, 158, 11, 0.3)", "rgba(245, 158, 11, 0)"]
    },
    danger: {
      stroke: "stroke-red-500",
      fill: "fill-red-500/10",
      point: "fill-red-500",
      gradient: ["rgba(239, 68, 68, 0.3)", "rgba(239, 68, 68, 0)"]
    }
  };

  // Auto-color based on trend
  const autoColor = chartData.trend === "up" ? "success" : chartData.trend === "down" ? "danger" : "primary";
  const selectedColor = colorMap[color === "primary" ? autoColor : color];

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={selectedColor.gradient[0]} />
          <stop offset="100%" stopColor={selectedColor.gradient[1]} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showArea && (
        <motion.path
          d={chartData.areaPath}
          fill={`url(#sparkline-gradient-${color})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Line */}
      <motion.path
        d={chartData.linePath}
        fill="none"
        className={selectedColor.stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Points */}
      {showPoints && chartData.points.map((point, index) => (
        <motion.g key={index}>
          <motion.circle
            cx={point.x}
            cy={point.y}
            r={4}
            className={cn(selectedColor.point, "stroke-background stroke-2")}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
          />
          {/* Value label on hover - simplified for now */}
          {(index === 0 || index === chartData.points.length - 1) && (
            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              className="text-[10px] fill-foreground font-medium"
            >
              {point.value}
            </text>
          )}
        </motion.g>
      ))}
    </svg>
  );
}

// Mini sparkline for inline use
export function MiniSparkline({ 
  data, 
  className 
}: { 
  data: number[]; 
  className?: string 
}) {
  return (
    <Sparkline
      data={data}
      width={80}
      height={24}
      strokeWidth={1.5}
      showPoints={false}
      showArea={false}
      className={className}
    />
  );
}
