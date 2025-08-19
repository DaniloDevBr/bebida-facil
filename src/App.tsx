import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import Sales from "./pages/Sales";
import Relatorios from "./pages/Relatorios";
import Estoque from "./pages/Estoque";
import Notificacoes from "./pages/Notificacoes";
import CatalogoClientes from "./pages/CatalogoClientes";
import { AuthProvider, useAuth } from "./services/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Rota privada para admin
const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Carregando...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/catalogo" element={<CatalogoClientes />} />

          {/* Rotas privadas (admin) */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <Products />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/produtos/adicionar"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <AddProduct />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/vendas"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <Sales />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <Relatorios />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/estoque"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <Estoque />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/notificacoes"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <Notificacoes />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />

          {/* Redirecionamento para Dashboard ou catálogo */}
          <Route path="*" element={<Navigate to="/catalogo" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
