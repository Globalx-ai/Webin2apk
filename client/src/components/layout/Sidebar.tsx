import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type SidebarLink = {
  path: string;
  label: string;
  icon: string;
};

const mainLinks: SidebarLink[] = [
  { path: "/", label: "Dashboard", icon: "dashboard" },
  { path: "/projects", label: "My Projects", icon: "history" },
];

const createLinks: SidebarLink[] = [
  { path: "/new-conversion", label: "New Conversion", icon: "add_circle" },
];

const helpLinks: SidebarLink[] = [
  { path: "/documentation", label: "Documentation", icon: "help_outline" },
  { path: "https://github.com", label: "GitHub Repository", icon: "code" },
];

const Sidebar = () => {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const NavLink = ({ link }: { link: SidebarLink }) => {
    const isExternal = link.path.startsWith("http");
    const isActive = location === link.path;
    
    if (isExternal) {
      return (
        <a 
          href={link.path} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition"
          onClick={closeMobileMenu}
        >
          <span className="material-icons mr-3">{link.icon}</span>
          {link.label}
        </a>
      );
    }
    
    return (
      <Link 
        href={link.path} 
        onClick={closeMobileMenu}
        className={cn(
          "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition",
          isActive && "bg-gray-700 text-white",
          link.path === "/new-conversion" && "text-white bg-blue-600 hover:bg-blue-700"
        )}
      >
        <span className="material-icons mr-3">{link.icon}</span>
        {link.label}
      </Link>
    );
  };

  return (
    <aside className="bg-gray-800 text-white w-full md:w-64 md:fixed md:h-full md:overflow-y-auto flex-shrink-0 transition-all duration-300 ease-in-out z-10">
      <div className="p-4 flex items-center justify-between md:justify-center">
        <div className="flex items-center space-x-2">
          <span className="material-icons text-purple-500">android</span>
          <h1 className="text-xl font-semibold">App Bundle Maker</h1>
        </div>
        <button 
          className="md:hidden focus:outline-none"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span className="material-icons">
            {isMobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>
      
      <nav className={cn("mt-5", isMobile && !isMobileMenuOpen && "hidden", "md:block")} id="mobileMenu">
        <div className="px-4 py-2 text-gray-400 uppercase text-xs font-semibold">
          Main
        </div>
        
        {mainLinks.map((link) => (
          <NavLink key={link.path} link={link} />
        ))}
        
        <div className="px-4 py-2 mt-6 text-gray-400 uppercase text-xs font-semibold">
          Create
        </div>
        
        {createLinks.map((link) => (
          <NavLink key={link.path} link={link} />
        ))}
        
        <div className="px-4 py-2 mt-6 text-gray-400 uppercase text-xs font-semibold">
          Help
        </div>
        
        {helpLinks.map((link) => (
          <NavLink key={link.path} link={link} />
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 hidden md:block">
        <Link href="/settings" className="flex items-center text-gray-300 hover:text-white transition">
          <span className="material-icons mr-3">settings</span>
          Settings
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
