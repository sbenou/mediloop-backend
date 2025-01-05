import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Products from "@/pages/Products";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/products" element={<Products />} />
        <Route path="/" element={<Navigate to="/products" replace />} />
      </Routes>
    </Router>
  );
}

export default App;