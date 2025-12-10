import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWeb3 } from "@/contexts/Web3Context";
import { toast } from "sonner";
import { MockViolation } from "@/data/mockData";

// Mock data for violations (kept for fallback)
const FALLBACK_VIOLATIONS = [
  {
    id: "0x7f...3a21",
    vehicleId: "KBZ 123X",
    offense: "Speeding 16-20 kph over limit",
    location: "Mombasa Road, Nairobi",
    amount: 10000,
    status: "Unpaid",
    timestamp: "2025-12-10 08:45 AM",
    officer: "Officer J. Kamau (ID: #4421)"
  },
  {
    id: "0x8a...4b32",
    vehicleId: "KCA 456Y",
    offense: "Failure to stop when signaled",
    location: "Thika Superhighway",
    amount: 5000,
    status: "Paid",
    timestamp: "2025-12-09 02:15 PM",
    officer: "Officer M. Ochieng (ID: #3312)"
  },
  {
    id: "0x9c...5c43",
    vehicleId: "KDD 789Z",
    offense: "Driving without valid license",
    location: "Langata Road",
    amount: 3000,
    status: "Appealed",
    timestamp: "2025-12-08 11:30 AM",
    officer: "Officer S. Wanjiku (ID: #5567)"
  },
  {
    id: "0x1d...6d54",
    vehicleId: "KBZ 123X",
    offense: "Failure to wear seatbelt",
    location: "Uhuru Highway",
    amount: 500,
    status: "Refunded",
    timestamp: "2025-11-25 09:10 AM",
    officer: "Officer J. Kamau (ID: #4421)"
  },
  {
    id: "0x2e...7e65",
    vehicleId: "KEE 101A",
    offense: "Obstruction",
    location: "CBD",
    amount: 10000,
    status: "Waived",
    timestamp: "2025-11-20 10:00 AM",
    officer: "Officer P. Njoroge (ID: #1122)"
  }
];

export default function Violations() {
  const { dataService, account, isOfficer, isAdmin } = useWeb3();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [violations, setViolations] = useState<MockViolation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadViolations();
  }, [dataService, account]);

  const loadViolations = async () => {
    if (!dataService) return;
    
    try {
      setLoading(true);
      let filters: any = {};
      
      // Officers see only their violations, citizens see their own, admins see all
      if (isOfficer) {
        filters.officerId = account;
      } else if (!isAdmin && account) {
        filters.driverId = account;
      }
      
      const data = await dataService.getViolations(filters);
      setViolations(data);
    } catch (error) {
      console.error("Error loading violations:", error);
      toast.error("Failed to load violations");
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async (violationId: string, amount: string) => {
    if (!dataService) return;
    
    try {
      setLoading(true);
      await dataService.payFine(violationId, amount);
      toast.success("Fine payment initiated!");
      loadViolations();
    } catch (error) {
      console.error("Error paying fine:", error);
      toast.error("Failed to pay fine");
    } finally {
      setLoading(false);
    }
  };

  const handleAppeal = async (violationId: string) => {
    // Navigate to appeals page with violation ID
    window.location.href = `/appeals?violationId=${violationId}`;
  };

  const filteredViolations = violations.filter(v => {
    const matchesSearch = v.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.violationId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || v.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Traffic Violations</h1>
          <p className="text-muted-foreground">Search and manage traffic violation records on the blockchain.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Vehicle Plate or Violation ID..." 
                className="pl-10 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {["All", "Unpaid", "Paid", "Appealed", "Refunded", "Waived"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "whitespace-nowrap",
                    filterStatus === status && status === "Unpaid" ? "bg-red-600 hover:bg-red-700" : "",
                    filterStatus === status && status === "Paid" ? "bg-accent hover:bg-accent/90 text-primary" : "",
                    filterStatus === status && status === "Appealed" ? "bg-blue-600 hover:bg-blue-700" : "",
                    filterStatus === status && status === "Refunded" ? "bg-green-600 hover:bg-green-700" : "",
                    filterStatus === status && status === "Waived" ? "bg-gray-600 hover:bg-gray-700" : ""
                  )}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violations List */}
      <div className="space-y-4">
        {filteredViolations.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <div className="bg-muted/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-primary">No violations found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredViolations.map((violation) => (
            <Card key={violation.violationId} className="border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
              <div className="flex flex-col md:flex-row">
                {/* Status Strip */}
                <div className={cn(
                  "w-full md:w-2 h-2 md:h-auto",
                  violation.status === "Unpaid" ? "bg-red-500" : 
                  violation.status === "Paid" ? "bg-accent" : 
                  violation.status === "Appealed" ? "bg-blue-500" :
                  violation.status === "Refunded" ? "bg-green-500" : "bg-gray-500"
                )} />
                
                <div className="flex-1 p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/5 p-3 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-primary">{violation.vehicleId}</h3>
                          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {violation.violationId.slice(0, 10)}...
                          </span>
                        </div>
                        <p className="font-medium text-primary/80">{violation.offenseName}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{new Date(violation.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span>{violation.location || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold font-mono text-primary">
                        KES {parseInt(violation.fineAmount).toLocaleString()}
                      </div>
                      <div className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1",
                        violation.status === "Unpaid" ? "bg-red-100 text-red-800" : 
                        violation.status === "Paid" ? "bg-green-100 text-green-800" : 
                        violation.status === "Appealed" ? "bg-blue-100 text-blue-800" :
                        violation.status === "Refunded" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      )}>
                        {violation.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                    <div className="text-sm text-muted-foreground">
                      Issued by: <span className="font-medium text-primary">{violation.officerName}</span>
                    </div>
                    <div className="flex gap-2">
                      {violation.evidenceHash && (
                        <Button variant="ghost" size="sm" className="text-primary hover:text-secondary">
                          View Evidence
                        </Button>
                      )}
                      {violation.status === "Unpaid" && violation.driverId === account && (
                        <Button 
                          size="sm" 
                          className="bg-secondary hover:bg-secondary/90 text-white"
                          onClick={() => handlePayFine(violation.violationId, violation.fineAmount)}
                          disabled={loading}
                        >
                          Pay Fine
                        </Button>
                      )}
                      {(violation.status === "Unpaid" || violation.status === "Paid") && violation.driverId === account && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAppeal(violation.violationId)}
                        >
                          Appeal
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
