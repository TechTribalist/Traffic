import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { useDevelopmentMode } from "../contexts/DevelopmentModeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Shield, UserPlus, UserX, Settings, AlertCircle, Database } from "lucide-react";
import { MockOfficer, OFFENSE_CODES } from "../data/mockData";

export default function AdminPanel() {
  const { isAdmin, isOfficerManager, dataService } = useWeb3();
  const { isDevelopmentMode, toggleDevelopmentMode } = useDevelopmentMode();
  const [officers, setOfficers] = useState<MockOfficer[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [newOfficer, setNewOfficer] = useState({
    address: "",
    name: "",
    badgeNumber: ""
  });
  
  const [offenseUpdate, setOffenseUpdate] = useState({
    code: 1,
    fineAmount: 0,
    name: "",
    isActive: true
  });

  useEffect(() => {
    loadOfficers();
  }, [dataService]);

  const loadOfficers = async () => {
    if (!dataService) return;
    
    try {
      setLoading(true);
      const officersList = await dataService.getOfficers();
      setOfficers(officersList);
    } catch (error) {
      console.error("Error loading officers:", error);
      toast.error("Failed to load officers");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterOfficer = async () => {
    if (!dataService) return;
    
    try {
      setLoading(true);
      await dataService.registerOfficer(
        newOfficer.address,
        newOfficer.name,
        newOfficer.badgeNumber
      );
      
      toast.success("Officer registered successfully!");
      setNewOfficer({ address: "", name: "", badgeNumber: "" });
      loadOfficers();
    } catch (error) {
      console.error("Error registering officer:", error);
      toast.error("Failed to register officer");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateOfficer = async (address: string) => {
    if (!dataService) return;
    
    try {
      setLoading(true);
      await dataService.deactivateOfficer(address);
      toast.success("Officer deactivated successfully!");
      loadOfficers();
    } catch (error) {
      console.error("Error deactivating officer:", error);
      toast.error("Failed to deactivate officer");
    } finally {
      setLoading(false);
    }
  };

  // Check access
  if (!isAdmin && !isOfficerManager) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page. Only Admin and Officer Manager roles can access the admin panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage officers and system settings</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Development Mode</Label>
            <Switch 
              checked={isDevelopmentMode}
              onCheckedChange={() => {
                toggleDevelopmentMode();
                toast.success(`Switched to ${!isDevelopmentMode ? "Development" : "Production"} mode`);
              }}
            />
            <Badge variant={isDevelopmentMode ? "secondary" : "default"}>
              {isDevelopmentMode ? "Mock Data" : "Live Contract"}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="officers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="officers">Officer Management</TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="offenses">Offense Configuration</TabsTrigger>
              <TabsTrigger value="system">System Settings</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="officers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Register New Officer</CardTitle>
              <CardDescription>Add a new officer to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="address">Wallet Address</Label>
                  <Input
                    id="address"
                    placeholder="0x..."
                    value={newOfficer.address}
                    onChange={(e) => setNewOfficer({ ...newOfficer, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newOfficer.name}
                    onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="badge">Badge Number</Label>
                  <Input
                    id="badge"
                    placeholder="NPS-001"
                    value={newOfficer.badgeNumber}
                    onChange={(e) => setNewOfficer({ ...newOfficer, badgeNumber: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                className="mt-4"
                onClick={handleRegisterOfficer}
                disabled={loading || !newOfficer.address || !newOfficer.name || !newOfficer.badgeNumber}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Register Officer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Officers</CardTitle>
              <CardDescription>Manage registered officers in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {officers.length === 0 ? (
                  <p className="text-muted-foreground">No officers registered yet</p>
                ) : (
                  officers.map((officer) => (
                    <div key={officer.address} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Shield className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{officer.name}</p>
                          <p className="text-sm text-muted-foreground">Badge: {officer.badgeNumber}</p>
                          <p className="text-xs text-muted-foreground font-mono">{officer.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{officer.violationsLogged} violations</p>
                          <Badge variant={officer.isActive ? "default" : "secondary"}>
                            {officer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {officer.isActive && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeactivateOfficer(officer.address)}
                            disabled={loading}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="offenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Offense Configuration</CardTitle>
                <CardDescription>Manage offense types and fine amounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {OFFENSE_CODES.map((offense) => (
                      <div key={offense.code} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Code {offense.code}</p>
                            <p className="text-sm text-muted-foreground">{offense.name}</p>
                          </div>
                          <Badge>KES {offense.fineKES}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    Currently in {isDevelopmentMode ? "Development" : "Production"} mode. 
                    {isDevelopmentMode 
                      ? " Using mock data for testing."
                      : " Connected to live smart contract."}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Rate Limits</h3>
                  <p className="text-sm text-muted-foreground">Maximum violations per officer per day: 100</p>
                  <p className="text-sm text-muted-foreground">Maximum appeals per violation: 3</p>
                  <p className="text-sm text-muted-foreground">Appeal cooldown period: 7 days</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Emergency Controls</h3>
                  <div className="flex gap-2">
                    <Button variant="destructive" disabled>
                      <Settings className="mr-2 h-4 w-4" />
                      Pause Contract
                    </Button>
                    <Button variant="outline" disabled>
                      Resume Contract
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Emergency controls are only available when connected to live contract
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}