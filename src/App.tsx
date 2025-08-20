// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import LoginClientes from "./pages/LoginClientes";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import Sales from "./pages/Sales";
import Relatorios from "./pages/Relatorios";
import Estoque from "./pages/Estoque";
import Notificacoes from "./pages/Notificacoes";
import PedidosCliente from "./pages/PedidosCliente";
import AdminPedidos from "./pages/AdminPedidos";
import CatalogoClientes from "./pages/CatalogoClientes";
import { AuthProvider, useAuth } from "./services/AuthContext";
import { AuthRoleProvider, useAuthRole } from "./services/AuthRoleContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// 🔹 Rota privada baseada em role
const RoleProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactElement;
  allowedRoles: string[];
}) => {
  const { user, loading } = useAuth();
  const { role, loading: loadingRole } = useAuthRole();

  if (loading || loadingRole)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Carregando...
      </div>
    );

  if (!user) return <Navigate to="/loginclientes" replace />;

  const userRole = role?.toLowerCase();
  if (!userRole || !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <h2 className="text-2xl font-bold mb-4">Acesso negado</h2>
        <p>Sua conta não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return children;
};

// 🔹 Redirecionamento raiz baseado na role
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const { role, loading: loadingRole } = useAuthRole();

  if (loading || loadingRole)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Carregando...
      </div>
    );

  if (!user) return <Navigate to="/loginclientes" replace />;

  const userRole = role?.toLowerCase();
  if (userRole === "admin") return <Navigate to="/dashboard" replace />;
  if (userRole === "cliente") return <Navigate to="/catalogo" replace />;

  return <Navigate to="/loginclientes" replace />;
};

// 🔹 Rota pública protegida (bloqueia catálogo público se logado)
const PublicOnlyRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();
  const { role, loading: loadingRole } = useAuthRole();

  if (loading || loadingRole)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Carregando...
      </div>
    );

  if (user) {
    const userRole = role?.toLowerCase();
    if (userRole === "admin") return <Navigate to="/dashboard" replace />;
    if (userRole === "cliente") return <Navigate to="/catalogo" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <AuthRoleProvider>
        <Router>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/loginclientes" element={<LoginClientes />} />
            <Route path="/register" element={<Register />} />

            {/* Catálogo público */}
            <Route
              path="/catalogo-publico"
              element={
                <PublicOnlyRoute>
                  <CatalogoClientes />
                </PublicOnlyRoute>
              }
            />

            {/* Redirecionamento raiz */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Rotas privadas admins */}
            <Route
              path="/dashboard"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/produtos"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <ErrorBoundary>
                    <Products />
                  </ErrorBoundary>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/produtos/adicionar"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <ErrorBoundary>
                    <AddProduct />
                  </ErrorBoundary>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/vendas"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <ErrorBoundary>
                    <Sales />
                  </ErrorBoundary>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <ErrorBoundary>
                    <Relatorios />
                  </ErrorBoundary>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/estoque"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <ErrorBoundary>
                    <Estoque />
                  </ErrorBoundary>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/notificacoes"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <ErrorBoundary>
                    <Notificacoes />
                  </ErrorBoundary>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/admin/pedidos"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <ErrorBoundary>
                    <AdminPedidos />
                  </ErrorBoundary>
                </RoleProtectedRoute>
              }
            />

            {/* Rotas privadas clientes */}
            <Route
              path="/pedidos"
              element={
                <RoleProtectedRoute allowedRoles={["cliente"]}>
                  <ErrorBoundary>
                    <PedidosCliente />
                  </ErrorBoundary>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/catalogo"
              element={
                <RoleProtectedRoute allowedRoles={["cliente"]}>
                  <ErrorBoundary>
                    <CatalogoClientes />
                  </ErrorBoundary>
                </RoleProtectedRoute>
              }
            />

            {/* Redirecionamento wildcard */}
            <Route path="*" element={<Navigate to="/loginclientes" replace />} />
          </Routes>
        </Router>
      </AuthRoleProvider>
    </AuthProvider>
  );
}

export default App;
