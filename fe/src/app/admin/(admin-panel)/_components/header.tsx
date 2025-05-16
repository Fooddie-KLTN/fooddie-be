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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-base font-medium ${
            action.variant === 'primary'
              ? 'text-white bg-primary hover:bg-primary/90 hover:text-primary hover:border-primary/90 shadow-sm'
              : 'text-primary bg-white border border-primary hover:bg-primary/10'
          }`}
          onClick={action.onClick}
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export default Header;