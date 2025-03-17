"use client"
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  previousValue: string;
  change: string;
  isPositive: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, previousValue, change, isPositive }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button className="text-blue-500 hover:underline">Chi tiết</button>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className=" text-md text-gray-500">Previous: {previousValue}</p>
      <p className={`text-md ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{change}</p>
    </div>
  );
};

export default StatCard;