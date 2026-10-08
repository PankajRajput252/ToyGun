import React from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'orange' | 'green' | 'red' | 'blue' | 'purple';
  chart?: 'bar' | 'line';
  // onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  chart = 'bar',
  // onClick 
}) => {
  
  const getColorClasses = () => {
    switch (color) {
      case 'orange':
        return {
          bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
          text: 'text-orange-100',
          icon: 'text-orange-200'
        };
      case 'green':
        return {
          bg: 'bg-gradient-to-br from-green-500 to-green-600',
          text: 'text-green-100',
          icon: 'text-green-200'
        };
      case 'red':
        return {
          bg: 'bg-gradient-to-br from-red-500 to-red-600',
          text: 'text-red-100',
          icon: 'text-red-200'
        };
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
          text: 'text-blue-100',
          icon: 'text-blue-200'
        };
      case 'purple':
        return {
          bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
          text: 'text-purple-100',
          icon: 'text-purple-200'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-500 to-gray-600',
          text: 'text-gray-100',
          icon: 'text-gray-200'
        };
    }
  };

  const formatValue = (val: number) => {
    if (val >= 1000000000) {
      return `${(val / 1000000000).toFixed(1)}B`;
    } else if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const renderChart = () => {
    if (chart === 'line') {
      return (
        <div className="absolute bottom-2 left-2 right-2 h-8 opacity-30">
          <svg viewBox="0 0 100 30" className="w-full h-full">
            <path
              d="M0,25 Q20,15 40,20 T80,10 L100,5"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-white"
            />
          </svg>
        </div>
      );
    } else {
      // Bar chart
      const bars = [20, 35, 25, 40, 30, 45, 20, 35];
      return (
        <div className="absolute bottom-2 left-2 right-2 h-8 opacity-30 flex items-end justify-between">
          {bars.map((height, index) => (
            <div
              key={index}
              className="bg-white rounded-sm"
              style={{ 
                width: '8px', 
                height: `${height}%`,
                minHeight: '2px'
              }}
            />
          ))}
        </div>
      );
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div 
      className={`relative p-4 sm:p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer ${colorClasses.bg} hover:scale-105`}
      //    onClick={onClick}
    >
      {/* Icon */}
      <div className={`absolute top-4 right-4 ${colorClasses.icon}`}>
        {icon}
      </div>
      
      {/* Value */}
      <div className={`text-2xl sm:text-3xl font-bold ${colorClasses.text} mb-2 pr-8`}>
        ${formatValue(value)}
      </div>
      
      {/* Title */}
      <div className={`text-sm font-medium ${colorClasses.text} opacity-90`}>
        {title}
      </div>
      
      {/* Chart */}
      {renderChart()}
    </div>
  );
};

export default MetricCard;
