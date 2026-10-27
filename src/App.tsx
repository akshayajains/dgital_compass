import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SunTimesProvider } from "@/contexts/SunTimesContext";
import { StyleThemeProvider, useStyleTheme } from "@/contexts/StyleThemeContext";
import { CompassView } from "@/components/CompassView";
import { Toaster } from "@/components/ui/sonner";
import { HashRouter, Routes, Route } from "react-router-dom";

function AppInner() {
  const { styleColors } = useStyleTheme();
  
  // Apply dynamic background from the selected compass style
  const bgStyle = styleColors 
    ? { background: styleColors.bgGradient } 
    : undefined;

  return (
    <div 
      className="w-screen min-h-screen overflow-y-auto overflow-x-hidden transition-colors duration-500"
      style={bgStyle}
    >
      <HashRouter>
        <Routes>
          <Route path="/*" element={<CompassView />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="digital-compass-theme">
      <LanguageProvider>
        <SunTimesProvider>
          <StyleThemeProvider>
            <Toaster />
            <AppInner />
          </StyleThemeProvider>
        </SunTimesProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
