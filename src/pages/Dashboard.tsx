import React from "react";
import { useAuth } from "../services/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="container" style={{ maxWidth: 600, marginTop: 50 }}>
      <h1>Dashboard</h1>
      <p>Bem-vindo, {user?.email}</p>

      <nav style={{ marginTop: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Link to="/produtos" style={{ color: "#007bff" }}>
          📦 Gerenciar Produtos
        </Link>
        <Link to="/estoque" style={{ color: "#007bff" }}>
          📊 Visualizar Estoque
        </Link>
        <Link to="/vendas" style={{ color: "#007bff" }}>
          🧾 Registrar Vendas
        </Link>
        <Link to="/relatorios" style={{ color: "#007bff" }}>
          📈 Relatórios
        </Link>
      </nav>

      <button onClick={handleLogout}>Sair</button>
    </div>
  );
};

export default Dashboard;
