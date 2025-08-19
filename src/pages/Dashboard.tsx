import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import {
  FiMenu,
  FiX,
  FiBox,
  FiShoppingCart,
  FiBarChart2,
  FiBell,
  FiLogOut,
  FiTrendingUp,
} from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase"; // ajuste para seu config do Firebase

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // redireciona para a tela de login
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Meu Dashboard</h2>
          <button
            className="menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <nav className="menu">
          <Link to="/">
            <FiBarChart2 /> Visão Geral
          </Link>
          <Link to="/produtos">
            <FiBox /> Produtos
          </Link>
          <Link to="/vendas">
            <FiShoppingCart /> Vendas
          </Link>
          <Link to="/relatorios">
            <FiBarChart2 /> Relatórios
          </Link>
          <Link to="/notificacoes">
            <FiBell /> Notificações
          </Link>
        </nav>

        <div className="logout">
          <button onClick={handleLogout}>
            <FiLogOut /> Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="content">
        <h1>Visão Geral</h1>

        <div className="cards">
          <div className="card">
            <h3>
              Produtos <FiBox />
            </h3>
            <p>2</p>
          </div>

          <div className="card">
            <h3>
              Vendas <FiShoppingCart />
            </h3>
            <p>2</p>
          </div>

          <div className="card">
            <h3>
              Lucro <FiTrendingUp />
            </h3>
            <p>R$ 8,50</p>
          </div>
        </div>

        <div className="table-container">
          <h2>Últimas Vendas</h2>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Valor Total</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Brahma</td>
                <td>3</td>
                <td>R$ 13,50</td>
                <td>15/08/2025</td>
              </tr>
              <tr>
                <td>Skol</td>
                <td>2</td>
                <td>R$ 9,00</td>
                <td>15/08/2025</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        © 2025 Cloud Tecnologia. Todos os direitos reservados.
      </footer>
      <div className="footer-reserved">© 2025 Cloud Tecnologia. Todos os direitos reservados.</div>
    </div>
  );
}
