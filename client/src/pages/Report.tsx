import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, MapPin, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWeb3 } from "@/contexts/Web3Context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { OFFENSE_CODES } from "@/data/mockData";
import { useDevelopmentMode } from "@/contexts/DevelopmentModeContext";

export default function Report() {
  const { isOfficer, isAdmin, dataService, isConnected } = useWeb3();
  const { isDevelopmentMode } = useDevelopmentMode();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [selectedOffense, setSelectedOffense] = useState("");
  
  // Form data
  const [formData, setFormData] = useState({
    vehicleId: "",
    driverAddress: "",
    offenseCode: 0,
    location: "",
    notes: "",
    evidenceFile: null as File | null,
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dataService) {
      toast.error("Data service not initialized");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In production, upload evidence to IPFS first
      const evidenceHash = formData.evidenceFile 
        ? `QmExample${Math.random().toString(36).substring(7)}` 
        : "";
      
      const violationId = await dataService.logViolation(
        formData.vehicleId,
        formData.offenseCode,
        evidenceHash,
        formData.driverAddress
      );
      
      setTransactionHash(violationId || "0x" + Math.random().toString(16).substr(2, 16));
      setIsSuccess(true);
      toast.success("Violation reported successfully!");
    } catch (error) {
      console.error("Error reporting violation:", error);
      toast.error("Failed to report violation");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Check permissions - allow in development mode
  if (!isDevelopmentMode && !isOfficer && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to report violations. Only authorized officers can access this page.
            {!isConnected && " Please connect your wallet to check your permissions."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="h-24 w-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-12 w-12 text-accent" />
        </div>
        <h1 className="text-3xl font-bold text-primary">Violation Recorded Successfully</h1>
        <p className="text-muted-foreground text-lg">
          The violation has been immutably recorded on the blockchain. <br/>
          Transaction Hash: <span className="font-mono text-primary bg-muted px-2 py-1 rounded text-sm">
            {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
          </span>
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button onClick={() => {
            setIsSuccess(false);
            setFormData({
              vehicleId: "",
              driverAddress: "",
              offenseCode: 0,
              location: "",
              notes: "",
              evidenceFile: null,
            });
          }} variant="outline">Report Another</Button>
          <Button className="bg-secondary hover:bg-secondary/90 text-white">View Violation</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Report Violation</h1>
        <p className="text-muted-foreground">Log a new traffic incident to the blockchain ledger.</p>
      </div>

      <Card className="border-border shadow-md">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2 text-secondary font-medium">
            <FileText className="h-5 w-5" />
            <span>Official Incident Report Form</span>
          </div>
          <CardDescription>
            All data submitted will be cryptographically signed and permanently stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Vehicle Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="plate">License Plate Number</Label>
                  <Input 
                    id="plate" 
                    placeholder="e.g. KBZ 123X" 
                    className="font-mono uppercase text-lg" 
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value.toUpperCase() })}
                    required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver">Driver Wallet Address</Label>
                  <Input 
                    id="driver" 
                    placeholder="0x..." 
                    className="font-mono text-sm" 
                    value={formData.driverAddress}
                    onChange={(e) => setFormData({ ...formData, driverAddress: e.target.value })}
                    required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Vehicle Type</Label>
                  <Select defaultValue="private">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private Vehicle</SelectItem>
                      <SelectItem value="psv">PSV (Matatu/Bus)</SelectItem>
                      <SelectItem value="commercial">Commercial Truck</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Offense Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">Offense Details</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="offense">Violation Type</Label>
                  <Select onValueChange={(value) => {
                    setSelectedOffense(value);
                    setFormData({ ...formData, offenseCode: parseInt(value) });
                  }} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select violation code" />
                    </SelectTrigger>
                    <SelectContent>
                      {OFFENSE_CODES.map((offense) => (
                        <SelectItem key={offense.code} value={offense.code.toString()}>
                          {offense.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedOffense && (
                    <div className="bg-muted/50 p-3 rounded-md flex justify-between items-center mt-2">
                      <span className="text-sm text-muted-foreground">Statutory Fine:</span>
                      <span className="font-mono font-bold text-primary">
                        KES {OFFENSE_CODES.find(o => o.code === parseInt(selectedOffense))?.fineKES.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="location" placeholder="e.g. Mombasa Road, near Syokimau" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time of Incident</Label>
                    <Input id="time" type="datetime-local" required />
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">Evidence</h3>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/20 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">Click to upload photo/video evidence</p>
                    <p className="text-sm text-muted-foreground">Files will be hashed and stored on IPFS</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-2">
                    <Upload className="h-4 w-4 mr-2" /> Select Files
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Officer Notes</Label>
                <Textarea id="notes" placeholder="Additional context about the incident..." className="min-h-[100px]" />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 flex items-center justify-end gap-4">
              <Button type="button" variant="ghost">Cancel</Button>
              <Button 
                type="submit" 
                size="lg" 
                className="bg-secondary hover:bg-secondary/90 text-white min-w-[200px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing Transaction...
                  </>
                ) : (
                  "Log Violation to Blockchain"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
