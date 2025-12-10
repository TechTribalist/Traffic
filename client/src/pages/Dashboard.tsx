import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useDevelopmentMode } from "@/contexts/DevelopmentModeContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { isDevelopmentMode } = useDevelopmentMode();
  const { dataService } = useWeb3();
  const [stats, setStats] = useState({
    totalViolations: 0,
    totalFinesPaid: 0,
    pendingAppeals: 0,
    complianceRate: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      if (dataService) {
        const statistics = await dataService.getStatistics();
        setStats({
          totalViolations: statistics.totalViolations,
          totalFinesPaid: statistics.totalFinesPaid,
          pendingAppeals: statistics.pendingAppeals,
          complianceRate: statistics.complianceRate
        });
      }
    };
    loadStats();
  }, [dataService, isDevelopmentMode]);
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-lg bg-card">
        <div className="absolute inset-0 bg-[url('/images/hero-traffic.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40" />
        
        <div className="relative z-10 p-8 md:p-12 text-primary-foreground">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-secondary/20 p-2 rounded-lg backdrop-blur-sm border border-secondary/30">
              <Shield className="h-8 w-8 text-secondary" />
            </div>
            <span className="font-mono text-sm tracking-widest uppercase text-secondary">Official System</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight font-display">
            Traffic Enforcement <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
              Blockchain Ledger
            </span>
          </h1>
          
          <p className="max-w-2xl text-lg text-primary-foreground/80 mb-8 leading-relaxed">
            A transparent, tamper-evident system for managing traffic violations, fines, and appeals in Kenya. 
            Powered by Ethereum smart contracts for immutable record-keeping.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link href="/violations">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white border-none shadow-lg shadow-secondary/20">
                Check Violations
              </Button>
            </Link>
            <Link href="/report">
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
                Report Incident
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Violations" 
          value={stats.totalViolations.toLocaleString()} 
          change={isDevelopmentMode ? "Mock Data" : "Live Data"} 
          icon={AlertTriangle}
          color="text-secondary"
        />
        <StatsCard 
          title="Fines Collected" 
          value={`KES ${(stats.totalFinesPaid / 1000).toFixed(1)}K`} 
          change={isDevelopmentMode ? "Mock Data" : "Live Data"} 
          icon={TrendingUp}
          color="text-accent"
        />
        <StatsCard 
          title="Active Appeals" 
          value={stats.pendingAppeals.toString()} 
          change={isDevelopmentMode ? "Mock Data" : "Live Data"} 
          icon={Activity}
          color="text-blue-400"
        />
        <StatsCard 
          title="Compliance Rate" 
          value={`${stats.complianceRate}%`} 
          change={isDevelopmentMode ? "Mock Data" : "Live Data"} 
          icon={CheckCircle}
          color="text-accent"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-primary">Recent Violations</h2>
            <Link href="/violations">
              <Button variant="ghost" className="text-primary hover:text-secondary">View All &rarr;</Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <AlertTriangle className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary">Speeding (16-20 kph over)</h3>
                    <p className="text-sm text-muted-foreground font-mono">KBZ {123 + i}X • Mombasa Road</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-primary">KES 10,000</div>
                  <div className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 inline-block mt-1 font-medium">Unpaid</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-primary">System Status</h2>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Network Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Block Height</span>
                  <span className="font-mono text-sm text-primary">14,239,102</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full w-full animate-pulse" />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">Gas Price</span>
                  <span className="font-mono text-sm text-primary">12 gwei</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-secondary h-2 rounded-full w-[40%]" />
                </div>

                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex items-center gap-2 text-sm text-accent font-medium">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    All Systems Operational
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, change, icon: Icon, color }: any) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-lg bg-opacity-10", color.replace('text-', 'bg-'))}>
            <Icon className={cn("h-6 w-6", color)} />
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {change}
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
          <div className="text-3xl font-bold text-primary font-display">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
