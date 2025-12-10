import { Link, useLocation } from "wouter";
import { Shield, FileText, AlertTriangle, Gavel, Menu, X, Wallet, Settings, DollarSign } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/contexts/Web3Context";
import { useDevelopmentMode } from "@/contexts/DevelopmentModeContext";
import { Badge } from "@/components/ui/badge";
import DevelopmentModeIndicator from "./DevelopmentModeIndicator";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { connectWallet, isConnected, account, isAdmin, isOfficer, isOfficerManager, isJudge, isTreasury } = useWeb3();
  const { isDevelopmentMode } = useDevelopmentMode();

  const baseNavItems = [
    { href: "/", label: "Dashboard", icon: Shield, roles: ["all"] },
    { href: "/violations", label: "Violations", icon: AlertTriangle, roles: ["all"] },
    { href: "/report", label: "Report", icon: FileText, roles: ["officer", "admin"] },
    { href: "/appeals", label: "Appeals", icon: Gavel, roles: ["judge", "admin", "citizen"] },
  ];
  
  const adminNavItems = [
    { href: "/admin", label: "Admin Panel", icon: Settings, roles: ["admin", "manager"] },
    { href: "/treasury", label: "Treasury", icon: DollarSign, roles: ["treasury", "admin"] },
  ];
  
  // Filter navigation items based on user role
  const getVisibleNavItems = () => {
    const items = [...baseNavItems];
    
    // Add admin items if user has appropriate role
    if (isAdmin || isOfficerManager) {
      items.push(adminNavItems[0]);
    }
    if (isAdmin || isTreasury) {
      items.push(adminNavItems[1]);
    }
    
    // Filter based on role restrictions
    return items.filter(item => {
      if (item.roles.includes("all")) return true;
      if (item.roles.includes("admin") && isAdmin) return true;
      if (item.roles.includes("manager") && isOfficerManager) return true;
      if (item.roles.includes("officer") && isOfficer) return true;
      if (item.roles.includes("judge") && isJudge) return true;
      if (item.roles.includes("treasury") && isTreasury) return true;
      if (item.roles.includes("citizen") && !isAdmin && !isOfficer && !isJudge && !isTreasury && !isOfficerManager) return true;
      return false;
    });
  };
  
  const navItems = getVisibleNavItems();

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Shield className="h-6 w-6 text-secondary" />
          <span>KENYA TRAFFIC</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-secondary/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">TRAFFIC CHAIN</h1>
            <p className="text-xs text-sidebar-foreground/60">Official Enforcement</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 cursor-pointer group",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border-l-4 border-secondary"
                      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-secondary" : "text-sidebar-foreground/60 group-hover:text-secondary"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-4">
          <Button 
            onClick={connectWallet} 
            variant={isConnected ? "outline" : "default"}
            className={cn(
              "w-full justify-start gap-2", 
              isConnected ? "bg-sidebar-accent text-sidebar-foreground border-sidebar-border" : "bg-secondary hover:bg-secondary/90 text-white"
            )}
          >
            <Wallet className="h-4 w-4" />
            {isConnected ? (
              <span className="truncate font-mono text-xs">{account?.slice(0, 6)}...{account?.slice(-4)}</span>
            ) : (
              "Connect Wallet"
            )}
          </Button>

          {isConnected && (
            <div className="flex gap-2 flex-wrap">
              {isAdmin && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-1 rounded font-bold uppercase">Admin</span>}
              {isOfficerManager && <span className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded font-bold uppercase">Manager</span>}
              {isOfficer && <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-bold uppercase">Officer</span>}
              {isJudge && <span className="text-[10px] bg-amber-600 text-white px-2 py-1 rounded font-bold uppercase">Judge</span>}
              {isTreasury && <span className="text-[10px] bg-green-600 text-white px-2 py-1 rounded font-bold uppercase">Treasury</span>}
              {!isAdmin && !isOfficer && !isOfficerManager && !isJudge && !isTreasury && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded font-bold uppercase">Citizen</span>}
            </div>
          )}
          
          {isDevelopmentMode && (
            <Badge variant="secondary" className="w-full justify-center">
              DEVELOPMENT MODE
            </Badge>
          )}

          <div className="bg-sidebar-accent/30 rounded-lg p-4 border border-sidebar-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-mono text-sidebar-foreground/70">SYSTEM ONLINE</span>
            </div>
            <p className="text-xs text-sidebar-foreground/50 font-mono break-all">
              Block: #182934...
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background relative">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/images/blockchain-network.jpg')] bg-cover bg-center mix-blend-multiply" />
        
        <div className="relative z-10 container py-8 md:py-12">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Development Mode Indicator */}
      <DevelopmentModeIndicator />
    </div>
  );
}
