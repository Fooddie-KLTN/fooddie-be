"use client";
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  data: number[];
  labels: string[];
  label: string;
  maxValue?: number;
  backgroundColor?: string;
  borderRadius?: number;
  barThickness?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  labels,
  label,
  maxValue = Math.max(...data) + 100,
  backgroundColor = '#E5E7EB',
  borderRadius = 4,
  barThickness = 32,
}) => {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor,
        borderRadius,
        barThickness,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { 
        display: false 
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxValue,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;