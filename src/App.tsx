import { ThemeProvider } from "@/contexts/ThemeContext";
import { SunTimesProvider } from "@/contexts/SunTimesContext";
import { CompassView } from "@/components/CompassView";
import { Toaster } from "@/components/ui/sonner";

export const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="hindi-compass-theme">
      <SunTimesProvider>
        <Toaster />
        <div className="w-screen min-h-screen overflow-y-auto overflow-x-hidden bg-background">
          <CompassView />
        </div>
      </SunTimesProvider>
    </ThemeProvider>
  );
};

export default App;
