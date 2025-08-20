import React, { useState, useEffect } from "react";
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
import { auth, db } from "../services/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";

interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  valorCompra: number;
  valorVenda: number;
}

interface Venda {
  id: string;
  produtoId: string;
  nome: string;
  quantidade: number;
  unidade: string;
  data: any;
  valorCompra: number;
  valorVenda: number;
  margemLucro: number;
}

interface Notificacao {
  id: string;
  titulo: string;
  descricao: string;
  lida: boolean;
  data: any;
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const navigate = useNavigate();

  // Produtos em tempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "produtos"), (snapshot) => {
      const lista = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...(doc.data() as Omit<Produto, "id">) })
      );
      setProdutos(lista);
    });
    return () => unsubscribe();
  }, []);

  // Vendas em tempo real
  useEffect(() => {
    const q = query(collection(db, "vendas"), orderBy("data", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...(doc.data() as Omit<Venda, "id">) })
      );
      setVendas(lista);
    });
    return () => unsubscribe();
  }, []);

  // Notificações em tempo real
  useEffect(() => {
    const q = query(collection(db, "notificacoes"), orderBy("data", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Notificacao, "id">),
      }));
      setNotificacoes(lista);
    });
    return () => unsubscribe();
  }, []);

  // Contador de notificações não lidas
  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;

  // Marcar todas como lidas
  const marcarTodasComoLidas = async () => {
    for (const n of notificacoes.filter((n) => !n.lida)) {
      await updateDoc(doc(db, "notificacoes", n.id), { lida: true });
    }
  };

  const totalProdutos = produtos.length;
  const totalVendas = vendas.length;
  const totalLucro = vendas.reduce((acc, v) => acc + (v.margemLucro ?? 0), 0);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
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
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
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
          <Link
            to="/notificacoes"
            onClick={marcarTodasComoLidas}
          >
            <FiBell /> Notificações
            {notificacoesNaoLidas > 0 && (
              <span className="badge">{notificacoesNaoLidas}</span>
            )}
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
            <p>{totalProdutos}</p>
          </div>

          <div className="card">
            <h3>
              Vendas <FiShoppingCart />
            </h3>
            <p>{totalVendas}</p>
          </div>

          <div className="card">
            <h3>
              Lucro <FiTrendingUp />
            </h3>
            <p>R$ {totalLucro.toFixed(2)}</p>
          </div>
        </div>

        <div className="table-container">
          <h2>Últimas Vendas</h2>
          {vendas.length === 0 ? (
            <p className="text-gray-600">Nenhuma venda registrada ainda.</p>
          ) : (
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
                {vendas.map((venda) => (
                  <tr key={venda.id}>
                    <td>{venda.nome}</td>
                    <td>
                      {venda.quantidade} {venda.unidade}
                    </td>
                    <td>
                      R$ {(venda.quantidade * venda.valorVenda).toFixed(2)}
                    </td>
                    <td>
                      {venda.data?.toDate
                        ? venda.data.toDate().toLocaleString()
                        : "Data inválida"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
