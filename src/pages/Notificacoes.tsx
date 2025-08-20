import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiBell } from "react-icons/fi";
import { db } from "../services/firebase";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import "../styles/notificacoes.css";

interface Notificacao {
  id: string;
  titulo: string;
  descricao: string;
  lida: boolean;
  data: string;
}

const Notificacoes: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useEffect(() => {
    // escuta em tempo real a coleção de pedidos
    const unsub = onSnapshot(collection(db, "pedidos"), (snapshot) => {
      const novasNotificacoes: Notificacao[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const pedido = change.doc.data();
          const dataFormatada = pedido.criadoEm?.toDate
            ? pedido.criadoEm.toDate().toLocaleString()
            : new Date().toLocaleString();

          novasNotificacoes.push({
            id: change.doc.id,
            titulo: `Novo pedido de ${pedido.clienteNome}`,
            descricao: `Pedido #${change.doc.id} - Total: R$ ${pedido.total.toFixed(2)}`,
            lida: false,
            data: dataFormatada,
          });
        }
      });

      // adiciona novas notificações no topo
      if (novasNotificacoes.length > 0) {
        setNotificacoes((prev) => [...novasNotificacoes, ...prev]);
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
      <h1>
        <FiBell /> Notificações
      </h1>
      <div className="notificacoes-list">
        {notificacoes.length === 0 && <p>Não há notificações.</p>}
        {notificacoes.map((n) => (
          <div key={n.id} className={`notificacao-card ${n.lida ? "lida" : ""}`}>
            <div className="notificacao-info">
              <h3>{n.titulo}</h3>
              <p>{n.descricao}</p>
              <span className="notificacao-data">{n.data}</span>
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
