import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actionButton?: ReactNode;
}

const MainLayout = ({ children, title, subtitle, actionButton }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-whitesmoke">
      <Sidebar />
      <div className="ml-64">
        <Header title={title} subtitle={subtitle} actionButton={actionButton} />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
