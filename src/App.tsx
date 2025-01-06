import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Cart from "@/pages/Cart";
import Orders from "@/pages/Orders";
import Admin from "@/pages/Admin";
import ProductDetails from "@/pages/ProductDetails";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Layout>
          <Toaster />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;