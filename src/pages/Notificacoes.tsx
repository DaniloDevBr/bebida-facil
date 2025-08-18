import React, { useState } from "react";
import { FiCheckCircle, FiBell } from "react-icons/fi";
import "../styles/notificacoes.css"; // Crie este CSS ou adapte ao seu projeto

interface Notificacao {
  id: number;
  titulo: string;
  descricao: string;
  lida: boolean;
  data: string;
}

const Notificacoes: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([
    {
      id: 1,
      titulo: "Pedido recebido",
      descricao: "Seu pedido #1234 foi recebido e está sendo processado.",
      lida: false,
      data: "2025-08-18 14:30",
    },
    {
      id: 2,
      titulo: "Promoção especial",
      descricao: "Aproveite 20% de desconto em bebidas selecionadas!",
      lida: false,
      data: "2025-08-17 09:00",
    },
    {
      id: 3,
      titulo: "Pedido enviado",
      descricao: "Seu pedido #1233 foi enviado e está a caminho.",
      lida: true,
      data: "2025-08-16 17:45",
    },
  ]);

  const marcarComoLida = (id: number) => {
    setNotificacoes(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  return (
    <div className="notificacoes-container">
      <h1>
        <FiBell /> Notificações
      </h1>
      <div className="notificacoes-list">
        {notificacoes.length === 0 && <p>Não há notificações.</p>}
        {notificacoes.map(n => (
          <div
            key={n.id}
            className={`notificacao-card ${n.lida ? "lida" : ""}`}
          >
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
