import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  AlertCircle,
  DollarSign,
  Activity
} from "lucide-react";
import { MOCK_STATISTICS } from "../data/mockData";

export default function TreasuryPanel() {
  const { isTreasury, isAdmin, dataService, contract } = useWeb3();
  const [statistics, setStatistics] = useState(MOCK_STATISTICS);
  const [loading, setLoading] = useState(false);
  const [contractBalance, setContractBalance] = useState("0");
  
  // Withdrawal form
  const [withdrawal, setWithdrawal] = useState({
    recipient: "",
    amount: ""
  });

  useEffect(() => {
    loadStatistics();
    loadContractBalance();
  }, [dataService, contract]);

  const loadStatistics = async () => {
    if (!dataService) return;
    
    try {
      setLoading(true);
      const stats = await dataService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadContractBalance = async () => {
    if (!contract) {
      // Mock balance for development
      setContractBalance("125000");
      return;
    }
    
    try {
      const balance = await contract.provider.getBalance(contract.address);
      setContractBalance((parseInt(balance.toString()) / 1e18).toFixed(4));
    } catch (error) {
      console.error("Error loading balance:", error);
      setContractBalance("0");
    }
  };

  const handleWithdraw = async () => {
    if (!contract) {
      toast.success("Mock: Withdrawal of KES " + withdrawal.amount + " processed");
      setWithdrawal({ recipient: "", amount: "" });
      return;
    }
    
    try {
      setLoading(true);
      const tx = await contract.withdrawFunds(
        withdrawal.recipient,
        (parseFloat(withdrawal.amount) * 1e18).toString()
      );
      await tx.wait();
      
      toast.success("Withdrawal successful!");
      setWithdrawal({ recipient: "", amount: "" });
      loadContractBalance();
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      toast.error("Failed to withdraw funds");
    } finally {
      setLoading(false);
    }
  };

  // Check access
  if (!isTreasury && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page. Only Treasury and Admin roles can access the treasury panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Treasury Management</h1>
        <p className="text-muted-foreground">Monitor and manage system finances</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(parseFloat(contractBalance))}</div>
            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fines Paid</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.totalFinesPaid)}</div>
            <p className="text-xs text-muted-foreground">All time revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.totalFinesRefunded)}</div>
            <p className="text-xs text-muted-foreground">From successful appeals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">Fines paid on time</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Withdraw Funds</CardTitle>
            <CardDescription>Transfer funds from the contract to a recipient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={withdrawal.recipient}
                onChange={(e) => setWithdrawal({ ...withdrawal, recipient: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={withdrawal.amount}
                onChange={(e) => setWithdrawal({ ...withdrawal, amount: e.target.value })}
              />
            </div>
            <Button 
              onClick={handleWithdraw}
              disabled={loading || !withdrawal.recipient || !withdrawal.amount || parseFloat(withdrawal.amount) <= 0}
              className="w-full"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Withdraw Funds
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Statistics</CardTitle>
            <CardDescription>System financial performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Violations</span>
                <Badge variant="outline">{statistics.totalViolations}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Paid Violations</span>
                <Badge variant="outline">
                  {Math.floor(statistics.totalViolations * statistics.complianceRate / 100)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Unpaid Violations</span>
                <Badge variant="destructive">
                  {Math.floor(statistics.totalViolations * (100 - statistics.complianceRate) / 100)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Appeals</span>
                <Badge variant="secondary">{statistics.pendingAppeals}</Badge>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Net Revenue</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(statistics.totalFinesPaid - statistics.totalFinesRefunded)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Financial Activity</CardTitle>
          <CardDescription>Latest payments and withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: "payment", amount: 3000, from: "KAA 123A", time: "2 hours ago" },
              { type: "refund", amount: 500, to: "0x742d...bEb1", time: "5 hours ago" },
              { type: "payment", amount: 10000, from: "KBB 456B", time: "1 day ago" },
              { type: "withdrawal", amount: 50000, to: "Treasury", time: "3 days ago" },
              { type: "payment", amount: 2000, from: "KCC 789C", time: "3 days ago" },
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === "payment" ? "bg-green-100" :
                    transaction.type === "refund" ? "bg-red-100" :
                    "bg-blue-100"
                  }`}>
                    {transaction.type === "payment" ? (
                      <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    ) : transaction.type === "refund" ? (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium capitalize">{transaction.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.type === "payment" ? `From ${transaction.from}` :
                       `To ${transaction.to}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.type === "payment" ? "text-green-600" :
                    transaction.type === "refund" ? "text-red-600" :
                    "text-blue-600"
                  }`}>
                    {transaction.type === "payment" ? "+" : "-"}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{transaction.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}