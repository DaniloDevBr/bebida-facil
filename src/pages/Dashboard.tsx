import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import { FiMenu, FiX, FiBox, FiBarChart2, FiBell, FiLogOut, FiTrendingUp } from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { collection, onSnapshot, query, orderBy, limit, updateDoc, doc } from "firebase/firestore";

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
      const lista: Produto[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nome: data.nome ?? "Produto sem nome",
          quantidade: Number(data.quantidade ?? 0),
          unidade: data.unidade ?? "un",
          valorCompra: Number(data.valorCompra ?? 0),
          valorVenda: Number(data.valorVenda ?? 0),
        };
      });
      setProdutos(lista);
    });
    return () => unsubscribe();
  }, []);

  // Vendas em tempo real (Últimas 20)
  useEffect(() => {
    const q = query(collection(db, "vendas"), orderBy("data", "desc"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: Venda[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          produtoId: data.produtoId ?? "",
          nome: data.nome ?? "Produto sem nome",
          quantidade: Number(data.quantidade ?? 0),
          unidade: data.unidade ?? "un",
          valorCompra: Number(data.valorCompra ?? 0),
          valorVenda: Number(data.valorVenda ?? 0),
          data: data.data ?? null,
        };
      });
      setVendas(lista);
    });
    return () => unsubscribe();
  }, []);

  // Notificações em tempo real
  useEffect(() => {
    const q = query(collection(db, "notificacoes"), orderBy("data", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: Notificacao[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Notificacao, "id">),
      }));
      setNotificacoes(lista);
    });
    return () => unsubscribe();
  }, []);

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;

  const marcarTodasComoLidas = async () => {
    for (const n of notificacoes.filter(n => !n.lida)) {
      await updateDoc(doc(db, "notificacoes", n.id), { lida: true });
    }
  };

  // Cálculos em tempo real
  const totalProdutos = produtos.reduce((acc, p) => acc + (Number(p.quantidade) || 0), 0);
  const totalVendas = vendas.reduce((acc, v) => acc + (Number(v.quantidade) * Number(v.valorVenda)), 0);
  const totalLucro = vendas.reduce(
    (acc, v) => acc + (Number(v.valorVenda) - Number(v.valorCompra)) * Number(v.quantidade),
    0
  );

  const formatData = (data: any) =>
    data?.toDate
      ? data.toDate().toLocaleString()
      : data?.seconds
      ? new Date(data.seconds * 1000).toLocaleString()
      : "Data inválida";

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
            <FiBarChart2 /> Vendas
          </Link>
          <Link to="/relatorios">
            <FiBarChart2 /> Relatórios
          </Link>
          <Link to="/notificacoes" onClick={marcarTodasComoLidas}>
            <FiBell /> Notificações
            {notificacoesNaoLidas > 0 && <span className="badge">{notificacoesNaoLidas}</span>}
          </Link>
        </nav>

        <div className="logout">
          <button onClick={handleLogout}>
            <FiLogOut /> Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
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
              Vendas <FiBarChart2 />
            </h3>
            <p>R$ {totalVendas.toFixed(2)}</p>
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
                {vendas.map(venda => (
                  <tr key={venda.id}>
                    <td>{venda.nome}</td>
                    <td>{venda.quantidade} {venda.unidade}</td>
                    <td>R$ {(Number(venda.quantidade) * Number(venda.valorVenda)).toFixed(2)}</td>
                    <td>{formatData(venda.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <footer className="footer">
        © 2025 Cloud Tecnologia. Todos os direitos reservados.
      </footer>
    </div>
  );
}
