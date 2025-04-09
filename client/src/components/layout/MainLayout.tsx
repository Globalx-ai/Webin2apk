import { ReactNode } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import { Footer } from "./Footer";
import { useAuth } from "@/hooks/use-auth";
import { ImpersonationBar } from "@/components/admin/ImpersonationBar";

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

  // Check if we should show the footer
  const showFooter = ["/about", "/privacy", "/terms"].includes(location) || !user;
  
  // For pages with a footer, use a different layout
  if (showFooter) {
    return (
      <div className="min-h-screen flex flex-col">
        {user && <ImpersonationBar />}
        {user && <Sidebar />}
        <main className={`flex-1 ${user ? 'md:ml-64' : ''}`}>
          {children}
        </main>
        <div className={user ? 'md:ml-64' : ''}>
          <Footer />
        </div>
      </div>
    );
  }
  
  // Otherwise render with sidebar (if authenticated)
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {user && <ImpersonationBar />}
      {user && <Sidebar />}
      <main className={`flex-1 ${user ? 'md:ml-64' : ''} p-4 md:p-8`}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
