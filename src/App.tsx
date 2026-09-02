import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SunTimesProvider } from "@/contexts/SunTimesContext";
import { CompassView } from "@/components/CompassView";
import { Toaster } from "@/components/ui/sonner";

export const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="hindi-compass-theme">
      <LanguageProvider>
        <SunTimesProvider>
          <Toaster />
          <div className="w-screen min-h-screen overflow-y-auto overflow-x-hidden bg-background">
            <CompassView />
          </div>
        </SunTimesProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
