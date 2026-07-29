import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { cn } from '../../lib/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
      labels: { color: '#9ba6b8', font: { size: 11, family: 'Inter' } },
    },
    tooltip: {
      backgroundColor: 'rgba(19, 26, 43, 0.95)',
      titleColor: '#fff',
      bodyColor: '#c5ccd9',
      borderColor: 'rgba(0, 102, 255, 0.4)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#6b7891', font: { size: 10 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#6b7891', font: { size: 10 } },
    },
  },
};

function LineChart({ labels, datasets, title, gradient = true, className }) {
  const data = {
    labels,
    datasets: datasets.map((ds, i) => {
      const colors = [
        { border: '#00d4ff', bg1: 'rgba(0, 212, 255, 0.4)', bg2: 'rgba(0, 212, 255, 0.0)' },
        { border: '#00ff88', bg1: 'rgba(0, 255, 136, 0.4)', bg2: 'rgba(0, 255, 136, 0.0)' },
        { border: '#a855f7', bg1: 'rgba(168, 85, 247, 0.4)', bg2: 'rgba(168, 85, 247, 0.0)' },
        { border: '#ffd600', bg1: 'rgba(255, 214, 0, 0.4)', bg2: 'rgba(255, 214, 0, 0.0)' },
      ];
      const c = colors[i % colors.length];
      return {
        label: ds.label,
        data: ds.data,
        borderColor: ds.borderColor || c.border,
        backgroundColor: (context) => {
          if (!gradient) return ds.bgColor || c.bg1;
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return ds.bgColor || c.bg1;
          const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, ds.bgColor || c.bg1);
          g.addColorStop(1, c.bg2);
          return g;
        },
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: ds.borderColor || c.border,
        pointHoverBorderColor: '#0a0f1c',
        pointHoverBorderWidth: 2,
        borderWidth: 2.5,
        ...ds,
      };
    }),
  };
  return (
    <div className={cn('w-full h-64', className)}>
      <Line options={baseOptions} data={data} />
    </div>
  );
}

function BarChart({ labels, datasets, className }) {
  const data = {
    labels,
    datasets: datasets.map((ds, i) => {
      const colors = ['#0066ff', '#00ff88', '#00d4ff', '#a855f7', '#ffd600'];
      const border = ds.borderColor || colors[i % colors.length];
      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return border + '88';
          const g = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          g.addColorStop(0, border + '22');
          g.addColorStop(1, border + 'CC');
          return g;
        },
        borderRadius: 6,
        borderSkipped: false,
        borderWidth: 0,
        ...ds,
      };
    }),
  };
  return (
    <div className={cn('w-full h-64', className)}>
      <Bar options={baseOptions} data={data} />
    </div>
  );
}

function DoughnutChart({ labels, data, colors, className }) {
  const palette = colors || ['#0066ff', '#00ff88', '#00d4ff', '#a855f7', '#ffd600', '#ff0080', '#ff8800'];
  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: palette.map(c => c + 'CC'),
      borderColor: '#131a2b',
      borderWidth: 3,
      hoverBorderColor: palette,
      hoverBorderWidth: 2,
      hoverOffset: 6,
    }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#9ba6b8',
          padding: 12,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11 },
        },
      },
      tooltip: baseOptions.plugins.tooltip,
    },
  };
  return (
    <div className={cn('w-full h-64', className)}>
      <Doughnut options={options} data={chartData} />
    </div>
  );
}

export { LineChart, BarChart, DoughnutChart };
