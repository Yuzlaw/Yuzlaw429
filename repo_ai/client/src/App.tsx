import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UITextsProvider } from "./contexts/UITextsContext";
import NotesLocal from "./pages/NotesLocal";
import NoteEditorLocal from "./pages/NoteEditorLocal";
import SettingsLocal from "./pages/SettingsLocal";
import Finance from "./pages/Finance";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* 本機版（預設） */}
      <Route path={"/"} component={NotesLocal} />
      <Route path={"/notes"} component={NotesLocal} />
      <Route path={"/notes/:id"} component={NoteEditorLocal} />
      <Route path={"/settings"} component={SettingsLocal} />

      {/* 同步版（Google Sheets 備份） */}
      <Route path={"/sync"} component={NotesLocal} />
      <Route path={"/sync/notes"} component={NotesLocal} />
      <Route path={"/sync/notes/:id"} component={NoteEditorLocal} />
      <Route path={"/sync/settings"} component={SettingsLocal} />

      {/* 共用頁 */}
      <Route path={"/finance"} component={Finance} />
      <Route path={"/sync/finance"} component={Finance} />

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <UITextsProvider>
        <ThemeProvider
          defaultTheme="light"
          switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </UITextsProvider>
    </ErrorBoundary>
  );
}

export default App;
