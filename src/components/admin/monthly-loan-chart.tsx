"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from "chart.js";
import { Line } from "react-chartjs-2";
import staticChartData from "@/json/tren-peminjaman.json";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlyLoanChartProps {
  dynamicData?: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  };
}

export function MonthlyLoanChart({ dynamicData }: MonthlyLoanChartProps) {
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          font: {
            family: "inherit",
          }
        }
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#1e293b",
        bodyColor: "#334155",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "inherit",
          }
        }
      },
      y: {
        grid: {
          color: "#f1f5f9",
        },
        beginAtZero: true,
        ticks: {
          font: {
            family: "inherit",
          }
        }
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.4, // smooth curves
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 6,
      }
    }
  };

  const activeData = dynamicData || staticChartData;

  const data = {
    labels: activeData.labels,
    datasets: [
      {
        label: activeData.datasets[0]?.label || "Buku Dipinjam",
        data: activeData.datasets[0]?.data || [],
        borderColor: "#16a34a", // green-600
        backgroundColor: "rgba(22, 163, 74, 0.1)", // green-600 with opacity
        borderWidth: 2,
        fill: true,
      },
      {
        label: activeData.datasets[1]?.label || "Buku Dikembalikan",
        data: activeData.datasets[1]?.data || [],
        borderColor: "#2563eb", // blue-600
        backgroundColor: "rgba(37, 99, 235, 0.1)", // blue-600 with opacity
        borderWidth: 2,
        fill: true,
      }
    ],
  };

  return (
    <div className="w-full h-full min-h-[250px] relative">
      <Line options={options} data={data} />
    </div>
  );
}
