import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiBell, FiArrowLeft } from "react-icons/fi";
import { db } from "../services/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/notificacoes.css";

interface VendaItem {
  nome: string;
  quantidade: number;
  valorVenda: number;
}

interface Notificacao {
  id: string;
  titulo: string;
  descricao: string;
  resumo: string;
  lida: boolean;
  data: string;
  timestamp: number;
  itens?: VendaItem[];
}

const Notificacoes: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Query para pegar as últimas vendas
    const q = query(collection(db, "vendas"), orderBy("data", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const novasNotificacoes: Notificacao[] = [];

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const venda = change.doc.data() as any;
          const data = venda.data?.toDate ? venda.data.toDate() : new Date();

          // Monta resumo dos itens
          const resumo = venda.nome && venda.quantidade ? `${venda.quantidade}x ${venda.nome}` : "";

          novasNotificacoes.push({
            id: change.doc.id,
            titulo: `Venda registrada: ${venda.nome}`,
            descricao: `Quantidade: ${venda.quantidade} / Valor: R$ ${venda.valorVenda?.toFixed(2) ?? "0.00"}`,
            resumo,
            lida: false,
            data: data.toLocaleString(),
            timestamp: data.getTime(),
            itens: venda.nome
              ? [{ nome: venda.nome, quantidade: venda.quantidade, valorVenda: venda.valorVenda }]
              : [],
          });
        }
      });

      if (novasNotificacoes.length > 0) {
        setNotificacoes((prev) =>
          [...novasNotificacoes, ...prev].sort((a, b) => b.timestamp - a.timestamp)
        );
      }
    });

    return () => unsub();
  }, []);

  const marcarComoLida = (id: string) => {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  return (
    <div className="notificacoes-container">
      <div className="notificacoes-header">
        <button
          className="btn-voltar"
          onClick={() => navigate("/")}
          title="Voltar ao menu inicial"
        >
          <FiArrowLeft /> Voltar
        </button>
        <h1>
          <FiBell /> Notificações
        </h1>
      </div>

      <div className="notificacoes-list">
        {notificacoes.length === 0 && <p>Não há notificações.</p>}
        {notificacoes.map((n) => (
          <div key={n.id} className={`notificacao-card ${n.lida ? "lida" : ""}`}>
            <div className="notificacao-info">
              <h3>{n.titulo}</h3>
              <p>{n.descricao}</p>
              {n.resumo && <p style={{ whiteSpace: "pre-line" }}><strong>{n.resumo}</strong></p>}
              <span className="notificacao-data">{n.data}</span>

              {/* Itens detalhados */}
              {n.itens && n.itens.length > 0 && (
                <div className="notificacao-itens">
                  <h4>Detalhes da venda:</h4>
                  <ul>
                    {n.itens.map((item, idx) => (
                      <li key={idx}>
                        {item.nome} - {item.quantidade}x (R$ {item.valorVenda?.toFixed(2) ?? "0.00"})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {!n.lida && (
              <button
                className="btn-lida"
                onClick={() => marcarComoLida(n.id)}
                title="Marcar como lida"
              >
                <FiCheckCircle />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notificacoes;
