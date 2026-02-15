import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: ReactNode;
}

const Header = ({ title, subtitle, actionButton }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-whitesmoke border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-medium text-black">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Action Button */}
        {actionButton && (
          <div className="flex items-center gap-4">
            {actionButton}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
