import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Violations from "./pages/Violations";
import Report from "./pages/Report";
import Appeals from "./pages/Appeals";
import { Web3Provider } from "./contexts/Web3Context";
import { DevelopmentModeProvider, useDevelopmentMode } from "./contexts/DevelopmentModeContext";
import AdminPanel from "./pages/AdminPanel";
import TreasuryPanel from "./pages/TreasuryPanel";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/violations" component={Violations} />
        <Route path="/report" component={Report} />
        <Route path="/appeals" component={Appeals} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/treasury" component={TreasuryPanel} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function AppContent() {
  const { useMockData } = useDevelopmentMode();
  
  return (
    <Web3Provider useMockData={useMockData}>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </Web3Provider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <DevelopmentModeProvider>
        <AppContent />
      </DevelopmentModeProvider>
    </ErrorBoundary>
  );
}

export default App;
