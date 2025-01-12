import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecoilRoot } from "recoil";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Routes from "./Routes";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <BrowserRouter>
            <Routes />
            <Toaster />
          </BrowserRouter>
        </CurrencyProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App;