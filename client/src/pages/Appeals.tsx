import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Gavel, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWeb3 } from "@/contexts/Web3Context";
import { useDevelopmentMode } from "@/contexts/DevelopmentModeContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MockAppeal } from "@/data/mockData";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Appeals() {
  const { isJudge, isAdmin, account, dataService } = useWeb3();
  const { isDevelopmentMode } = useDevelopmentMode();
  const [appeals, setAppeals] = useState<MockAppeal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealForm, setAppealForm] = useState({
    violationId: "",
    reason: ""
  });

  useEffect(() => {
    loadAppeals();
  }, [dataService]);

  const loadAppeals = async () => {
    if (!dataService) return;
    
    try {
      setLoading(true);
      const data = await dataService.getAppeals();
      setAppeals(data);
    } catch (error) {
      console.error("Error loading appeals:", error);
      toast.error("Failed to load appeals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!dataService) return;
    
    try {
      setIsSubmittingAppeal(true);
      await dataService.submitAppeal(appealForm.violationId, appealForm.reason);
      toast.success("Appeal submitted successfully!");
      setAppealForm({ violationId: "", reason: "" });
      loadAppeals();
    } catch (error) {
      console.error("Error submitting appeal:", error);
      toast.error("Failed to submit appeal");
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const handleResolveAppeal = async (violationId: string, approved: boolean, resolution: string) => {
    if (!dataService) return;
    
    try {
      setLoading(true);
      await dataService.resolveAppeal(violationId, approved, resolution);
      toast.success(`Appeal ${approved ? "approved" : "rejected"} successfully!`);
      loadAppeals();
    } catch (error) {
      console.error("Error resolving appeal:", error);
      toast.error("Failed to resolve appeal");
    } finally {
      setLoading(false);
    }
  };

  const filteredAppeals = appeals.filter(appeal => 
    appeal.violationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appeal.vehicleId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Allow access in development mode or for authorized users
  const canSubmitAppeals = isDevelopmentMode || account;
  const canResolveAppeals = isDevelopmentMode || isJudge || isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Appeals Management</h1>
          <p className="text-muted-foreground">Track and resolve disputes through the decentralized judiciary system.</p>
        </div>
        
        {canSubmitAppeals && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Gavel className="mr-2 h-4 w-4" /> File New Appeal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>File an Appeal</DialogTitle>
                <DialogDescription>
                  Submit an appeal for a traffic violation. Provide the violation ID and your reason.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="violationId">Violation ID</Label>
                  <Input
                    id="violationId"
                    placeholder="0x..."
                    value={appealForm.violationId}
                    onChange={(e) => setAppealForm({ ...appealForm, violationId: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Appeal Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why you're appealing this violation..."
                    rows={4}
                    value={appealForm.reason}
                    onChange={(e) => setAppealForm({ ...appealForm, reason: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleSubmitAppeal}
                  disabled={isSubmittingAppeal || !appealForm.violationId || !appealForm.reason}
                  className="w-full"
                >
                  {isSubmittingAppeal ? "Submitting..." : "Submit Appeal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isDevelopmentMode && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Development Mode: All users can submit and resolve appeals for testing purposes.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats */}
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Appeal Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-bold text-primary">
                  {appeals.filter(a => a.status === "Pending").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approved</span>
                <span className="font-bold text-green-600">
                  {appeals.filter(a => a.status === "Approved").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rejected</span>
                <span className="font-bold text-red-600">
                  {appeals.filter(a => a.status === "Rejected").length}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-bold text-primary">
                  {appeals.length > 0 
                    ? `${Math.round((appeals.filter(a => a.status === "Approved").length / appeals.length) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appeals List */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by Violation ID or Vehicle ID..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" onClick={loadAppeals} disabled={loading}>
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </div>
            </CardHeader>
          </Card>

          {filteredAppeals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No appeals found</h3>
                <p className="text-muted-foreground">There are no appeals matching your search criteria.</p>
              </CardContent>
            </Card>
          ) : (
            filteredAppeals.map((appeal) => (
              <Card key={appeal.id} className="overflow-hidden">
                <div className="flex">
                  <div className={cn(
                    "w-1",
                    appeal.status === "Pending" ? "bg-yellow-500" : 
                    appeal.status === "Approved" ? "bg-green-500" : 
                    "bg-red-500"
                  )} />
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg">{appeal.vehicleId}</h3>
                          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                            {appeal.violationId.slice(0, 10)}...
                          </span>
                          <div className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                            appeal.status === "Pending" ? "bg-yellow-100 text-yellow-800" : 
                            appeal.status === "Approved" ? "bg-green-100 text-green-800" : 
                            "bg-red-100 text-red-800"
                          )}>
                            {appeal.status === "Pending" && <Clock className="h-3 w-3" />}
                            {appeal.status === "Approved" && <CheckCircle className="h-3 w-3" />}
                            {appeal.status === "Rejected" && <XCircle className="h-3 w-3" />}
                            {appeal.status}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Appeal Reason:</p>
                          <p className="text-sm">{appeal.appealReason}</p>
                        </div>
                        
                        {appeal.resolution && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Resolution:</p>
                            <p className="text-sm">{appeal.resolution}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(appeal.appealTime).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Appellant: {appeal.appellant.slice(0, 6)}...{appeal.appellant.slice(-4)}</span>
                        </div>
                      </div>
                      
                      {appeal.status === "Pending" && canResolveAppeals && (
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Appeal</DialogTitle>
                                <DialogDescription>
                                  Provide a resolution for this appeal approval.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Resolution</Label>
                                  <Textarea
                                    placeholder="Explain the reason for approval..."
                                    rows={4}
                                    id={`resolution-${appeal.id}`}
                                  />
                                </div>
                                <Button
                                  onClick={() => {
                                    const textarea = document.getElementById(`resolution-${appeal.id}`) as HTMLTextAreaElement;
                                    handleResolveAppeal(appeal.violationId, true, textarea.value);
                                  }}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  Confirm Approval
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Appeal</DialogTitle>
                                <DialogDescription>
                                  Provide a reason for rejecting this appeal.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Rejection Reason</Label>
                                  <Textarea
                                    placeholder="Explain the reason for rejection..."
                                    rows={4}
                                    id={`rejection-${appeal.id}`}
                                  />
                                </div>
                                <Button
                                  onClick={() => {
                                    const textarea = document.getElementById(`rejection-${appeal.id}`) as HTMLTextAreaElement;
                                    handleResolveAppeal(appeal.violationId, false, textarea.value);
                                  }}
                                  variant="destructive"
                                  className="w-full"
                                >
                                  Confirm Rejection
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}