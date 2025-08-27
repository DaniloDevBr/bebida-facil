// src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import {
  FiMenu,
  FiX,
  FiBox,
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
} from "firebase/firestore";
import { useAuthRole } from "../services/AuthRoleContext";

interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  valorCusto: number;
  valorVenda: number;
}

interface Venda {
  id: string;
  produtoId: string;
  nome: string;
  quantidade: number;
  unidade: string;
  data: any;
  valorCusto: number;
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
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;
  const navigate = useNavigate();
  const { role } = useAuthRole();

  // Produtos em tempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "produtos"), (snapshot) => {
      const lista: Produto[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nome: data.nome ?? "Produto sem nome",
          quantidade: Number(data.quantidade ?? 0),
          unidade: data.unidade ?? "un",
          valorCusto: Number(data.valorCusto ?? 0),
          valorVenda: Number(data.valorVenda ?? 0),
        };
      });
      setProdutos(lista);
    });
    return () => unsubscribe();
  }, []);

  // Vendas em tempo real (últimas 50)
  useEffect(() => {
    const q = query(collection(db, "vendas"), orderBy("data", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: Venda[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        const quantidade = Number(data.quantidade ?? 0);
        const valorVenda = Number(data.valorVenda ?? 0);

        // Pega valorCusto da venda se existir, senão busca no estoque
        const produtoEstoque = produtos.find((p) => p.id === data.produtoId);
        const valorCusto =
          Number(data.valorCusto ?? (produtoEstoque ? produtoEstoque.valorCusto : 0));

        return {
          id: docSnap.id,
          produtoId: data.produtoId ?? "",
          nome: data.nome ?? "Produto sem nome",
          quantidade,
          unidade: data.unidade ?? "un",
          valorCusto,
          valorVenda,
          data: data.data ?? null,
        };
      });
      setVendas(lista);
      setPaginaAtual(1);
    });
    return () => unsubscribe();
  }, [produtos]); // Dependência em produtos garante valorCusto correto

  // Notificações em tempo real
  useEffect(() => {
    const q = query(collection(db, "notificacoes"), orderBy("data", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: Notificacao[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Notificacao, "id">),
      }));
      setNotificacoes(lista);
    });
    return () => unsubscribe();
  }, []);

  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;

  const marcarTodasComoLidas = async () => {
    for (const n of notificacoes.filter((n) => !n.lida)) {
      await updateDoc(doc(db, "notificacoes", n.id), { lida: true });
    }
  };

  // Totais
  const totalProdutos = produtos.reduce(
    (acc, p) => acc + (Number(p.quantidade) || 0),
    0
  );
  const totalVendas = vendas.reduce(
    (acc, v) => acc + Number(v.quantidade) * Number(v.valorVenda),
    0
  );
  const totalLucro = vendas.reduce(
    (acc, v) => acc + (Number(v.valorVenda) - Number(v.valorCusto)) * Number(v.quantidade),
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

  const handleLinkClick = () => {
    if (sidebarOpen) setSidebarOpen(false);
  };

  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const vendasPagina = vendas.slice(indexPrimeiroItem, indexUltimoItem);
  const totalPaginas = Math.ceil(vendas.length / itensPorPagina);

  return (
    <div className="dashboard-container">
      <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
        <FiMenu />
      </button>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Meu Dashboard</h2>
          <button className="menu-btn" onClick={() => setSidebarOpen(false)}>
            <FiX />
          </button>
        </div>

        <nav className="menu">
          <Link to="/" onClick={handleLinkClick}>
            <FiBarChart2 /> Visão Geral
          </Link>
          <Link to="/produtos" onClick={handleLinkClick}>
            <FiBox /> Produtos
          </Link>
          <Link to="/vendas" onClick={handleLinkClick}>
            <FiBarChart2 /> Vendas
          </Link>
          <Link to="/relatorios" onClick={handleLinkClick}>
            <FiBarChart2 /> Relatórios
          </Link>
          <Link to="/pedidos-admin" onClick={handleLinkClick}>
            <FiBarChart2 /> Pedidos
          </Link>
          <Link
            to="/notificacoes"
            onClick={() => {
              marcarTodasComoLidas();
              handleLinkClick();
            }}
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
            <>
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Valor Total</th>
                    <th>Lucro</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasPagina.map((venda) => (
                    <tr key={venda.id}>
                      <td>{venda.nome}</td>
                      <td>
                        {venda.quantidade} {venda.unidade}
                      </td>
                      <td>
                        R${" "}
                        {(Number(venda.quantidade) * Number(venda.valorVenda)).toFixed(2)}
                      </td>
                      <td>
                        R${" "}
                        {((Number(venda.valorVenda) - Number(venda.valorCusto)) *
                          Number(venda.quantidade)).toFixed(2)}
                      </td>
                      <td>{formatData(venda.data)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="paginacao">
                <button
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual(paginaAtual - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <button
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPaginaAtual(paginaAtual + 1)}
                >
                  Próxima
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        © 2025 Cloud Tecnologia. Todos os direitos reservados.
      </footer>
    </div>
  );
}
