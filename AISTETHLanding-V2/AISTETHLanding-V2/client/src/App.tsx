import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import CinematicLanding from "@/pages/CinematicLanding";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={CinematicLanding} />
      {/* previous marketing page, kept for reference */}
      <Route path="/classic" component={Landing} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
