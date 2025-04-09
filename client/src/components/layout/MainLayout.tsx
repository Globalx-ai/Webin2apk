import { ReactNode } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // If on auth page, render without sidebar
  if (location === "/auth") {
    return <>{children}</>;
  }

  // Otherwise render with sidebar (if authenticated)
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {user && <Sidebar />}
      <main className={`flex-1 ${user ? 'md:ml-64' : ''} p-4 md:p-8`}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
