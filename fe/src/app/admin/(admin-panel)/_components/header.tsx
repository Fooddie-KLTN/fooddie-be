import { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  description: string;
  actions: Array<{
    label: string;
    icon: ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

const Header: React.FC<HeaderProps> = ({ title, description, actions }) => (
  <div className="flex flex-col md:flex-row justify-between items-start mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <p className="text-base text-gray-500 mt-1">{description}</p>
    </div>
    <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
      {actions.map((action, index) => (
        <button
          key={index}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
            action.variant === 'primary'
              ? 'text-white bg-blue-500 hover:bg-blue-600'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
          onClick={action.onClick}
        >
          {action.icon}
          <span className="text-base font-medium">{action.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export default Header;