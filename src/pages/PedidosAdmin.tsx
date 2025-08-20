import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import "../styles/pedidosAdmin.css";

interface ProdutoPedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
}

interface Pedido {
  id: string;
  clienteNome: string;
  telefone: string;
  endereco?: string;
  total: number;
  status: "novo" | "confirmado" | "entregue";
  produtos: ProdutoPedido[];
  criadoEm: Timestamp;
}

const PedidosAdmin = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pedidos"), (snapshot) => {
      const lista: Pedido[] = [];
      snapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...(docSnap.data() as Omit<Pedido, "id">) });
      });
      // ordenar por criadoEm descendente
      lista.sort((a, b) => b.criadoEm.seconds - a.criadoEm.seconds);
      setPedidos(lista);
    });

    return () => unsub();
  }, []);

  const atualizarStatus = async (pedido: Pedido, novoStatus: Pedido["status"]) => {
    try {
      await updateDoc(doc(db, "pedidos", pedido.id), { status: novoStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  return (
    <div className="pedidos-container">
      <h1>Pedidos Recebidos</h1>
      {pedidos.length === 0 ? (
        <p>Nenhum pedido no momento.</p>
      ) : (
        <ul>
          {pedidos.map((pedido) => (
            <li key={pedido.id} className={`pedido-card ${pedido.status}`}>
              <div className="pedido-header">
                <h2>{pedido.clienteNome}</h2>
                <span className={`status ${pedido.status}`}>{pedido.status.toUpperCase()}</span>
              </div>
              <p>Telefone: {pedido.telefone}</p>
              {pedido.endereco && <p>Endereço: {pedido.endereco}</p>}
              <ul className="produtos-pedido">
                {pedido.produtos.map((p) => (
                  <li key={p.produtoId}>
                    {p.nome} x {p.quantidade} - R$ {(p.valorUnitario * p.quantidade).toFixed(2)}
                  </li>
                ))}
              </ul>
              <p className="total">Total: R$ {pedido.total.toFixed(2)}</p>
              <div className="botoes-status">
                {pedido.status !== "confirmado" && (
                  <button onClick={() => atualizarStatus(pedido, "confirmado")}>Confirmar</button>
                )}
                {pedido.status !== "entregue" && (
                  <button onClick={() => atualizarStatus(pedido, "entregue")}>Entregar</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PedidosAdmin;
