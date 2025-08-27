// src/pages/PedidosAdmin.tsx
import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, Timestamp, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/pedidosAdmin.css";

interface ProdutoPedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorCusto: number;
}

interface Pedido {
  id: string;
  clienteNome: string;
  telefone: string;
  endereco?: string;
  total: number;
  status: "novo" | "confirmado" | "Em Preparo" | "Saiu para Entrega" | "entregue" | "cancelado";
  produtos: ProdutoPedido[];
  criadoEm: Timestamp;
}

const PedidosAdmin = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pedidos"), (snapshot) => {
      const lista: Pedido[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Partial<Omit<Pedido, "id">> & { itens?: any[] };

        // Se existir "produtos", use; senão, use "itens" antigo
        const produtosData: any[] = Array.isArray(data.produtos) && data.produtos.length > 0
          ? data.produtos
          : Array.isArray(data.itens) && data.itens.length > 0
          ? data.itens
          : [];

        const produtos: ProdutoPedido[] = produtosData.map((p: any) => ({
          produtoId: p.produtoId || Math.random().toString(),
          nome: p.nome || "Produto sem nome",
          quantidade: p.quantidade || 0,
          valorUnitario: p.valorUnitario || p.preco || 0,
          valorCusto: p.valorCusto ?? p.custo ?? p.precoCusto ?? 0, // 🔹 fallback para custo
        }));

        return {
          id: docSnap.id,
          clienteNome: data.clienteNome || "Cliente sem nome",
          telefone: data.telefone || "Sem telefone",
          endereco: data.endereco,
          total: data.total || 0,
          status: data.status || "novo",
          produtos,
          criadoEm: data.criadoEm || Timestamp.now(),
        };
      });

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

  const devolverAoEstoque = async (pedido: Pedido) => {
    for (const item of pedido.produtos) {
      try {
        const produtoRef = doc(db, "produtos", item.produtoId);
        const produtoSnap = await getDoc(produtoRef);
        if (produtoSnap.exists()) {
          const produtoData = produtoSnap.data() as { quantidade: number };
          const novaQuantidade = (produtoData.quantidade || 0) + item.quantidade;
          await updateDoc(produtoRef, { quantidade: novaQuantidade });
        }
      } catch (error) {
        console.error(`Erro ao devolver produto ${item.nome} ao estoque:`, error);
      }
    }
  };

  const excluirPedido = async (pedidoId: string) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    if (!window.confirm("Deseja realmente excluir este pedido?")) return;

    try {
      await devolverAoEstoque(pedido);
      await deleteDoc(doc(db, "pedidos", pedidoId));
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
    }
  };

  const formatStatusClass = (status: string) => status.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="pedidos-container">
      <header className="pedidos-header">
        <h1>Pedidos Recebidos</h1>
        <button className="btn-dashboard" onClick={() => navigate("/dashboard")}>
          Retornar ao Dashboard
        </button>
      </header>

      {pedidos.length === 0 ? (
        <p className="sem-pedidos">Nenhum pedido no momento.</p>
      ) : (
        <div className="pedidos-grid">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className={`pedido-card ${formatStatusClass(pedido.status)}`}>
              <div className="pedido-header">
                <h2>{pedido.clienteNome}</h2>
                <span className={`status ${formatStatusClass(pedido.status)}`}>
                  {pedido.status.toUpperCase()}
                </span>
              </div>
              <p><strong>Telefone:</strong> {pedido.telefone}</p>
              {pedido.endereco && <p><strong>Endereço:</strong> {pedido.endereco}</p>}

              <div className="produtos-wrapper">
                <h3>Produtos:</h3>
                <ul className="produtos-pedido">
                  {pedido.produtos.map((p) => (
                    <li key={p.produtoId}>
                      {p.nome} x {p.quantidade} - Venda: R$ {(p.valorUnitario * p.quantidade).toFixed(2)} / Custo: R$ {(p.valorCusto * p.quantidade).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="total"><strong>Total:</strong> R$ {pedido.total.toFixed(2)}</p>

              <div className="botoes-status">
                <select
                  className="select-status"
                  value={pedido.status}
                  onChange={(e) => atualizarStatus(pedido, e.target.value as Pedido["status"])}
                >
                  <option value="novo">Novo</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="Em Preparo">Em Preparo</option>
                  <option value="Saiu para Entrega">Saiu para Entrega</option>
                  <option value="entregue">Entregue</option>
                  <option value="cancelado">Cancelado</option>
                </select>

                <button onClick={() => excluirPedido(pedido.id)} className="btn-excluir">
                  Excluir
                </button>
              </div>

              <p className="pedido-data">
                Criado em: {pedido.criadoEm.toDate().toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PedidosAdmin;
