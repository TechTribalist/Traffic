import { useDevelopmentMode } from "@/contexts/DevelopmentModeContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Wifi } from "lucide-react";
import { toast } from "sonner";

export default function DevelopmentModeIndicator() {
  const { isDevelopmentMode, toggleDevelopmentMode } = useDevelopmentMode();
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          toggleDevelopmentMode();
          toast.success(`Switched to ${!isDevelopmentMode ? "Development" : "Production"} mode`, {
            description: !isDevelopmentMode 
              ? "Now using mock data for testing" 
              : "Now connected to live blockchain"
          });
        }}
        className="shadow-lg border-2 bg-background hover:bg-accent"
      >
        {isDevelopmentMode ? (
          <>
            <Database className="h-4 w-4 mr-2 text-yellow-600" />
            <span>Development Mode</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4 mr-2 text-green-600" />
            <span>Live Mode</span>
          </>
        )}
      </Button>
    </div>
  );
}