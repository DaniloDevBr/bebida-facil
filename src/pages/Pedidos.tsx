import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore";
import "../styles/pedidos.css"; // CSS próprio da página

interface Pedido {
  id: string;
  clienteNome: string;
  telefone: string;
  endereco: string;
  pagamento: string;
  itens: { nome: string; quantidade: number; valorUnitario: number }[];
  total: number;
  status: string;
  criadoEm: any;
  clienteId: string;
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoPagina, setPedidoPagina] = useState(1);
  const pedidosPorPagina = 10;

  // Pedidos em tempo real
  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(q, snapshot => {
      const lista: Pedido[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as Omit<Pedido, "id">;
        return {
          id: docSnap.id,
          ...data,
          itens: data.itens?.map((i: any) => ({
            nome: i.nome,
            quantidade: i.quantidade,
            valorUnitario: i.valorUnitario ?? i.preco,
          })) || [],
        };
      });
      setPedidos(lista);
    });
    return () => unsubscribe();
  }, []);

  const atualizarStatus = async (pedidoId: string, novoStatus: string) => {
    try {
      await updateDoc(doc(db, "pedidos", pedidoId), { status: novoStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const excluirPedido = async (pedidoId: string) => {
    if (!window.confirm("Deseja realmente excluir este pedido?")) return;
    try {
      await deleteDoc(doc(db, "pedidos", pedidoId));
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
    }
  };

  const indexUltimoPedido = pedidoPagina * pedidosPorPagina;
  const indexPrimeiroPedido = indexUltimoPedido - pedidosPorPagina;
  const pedidosAtuais = pedidos.slice(indexPrimeiroPedido, indexUltimoPedido);
  const totalPaginas = Math.ceil(pedidos.length / pedidosPorPagina);

  const mudarPagina = (num: number) => {
    if (num < 1 || num > totalPaginas) return;
    setPedidoPagina(num);
  };

  return (
    <div className="pedidos-container">
      <h1>Pedidos de Clientes</h1>
      {pedidos.length === 0 ? (
        <p>Nenhum pedido registrado.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Total</th>
                <th>Status</th>
                <th>Data</th>
                <th>Itens</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {pedidosAtuais.map(p => (
                <tr key={p.id}>
                  <td>{p.clienteNome}</td>
                  <td>R$ {p.total.toFixed(2)}</td>
                  <td>
                    <select value={p.status} onChange={e => atualizarStatus(p.id, e.target.value)}>
                      <option value="Pendente">Pendente</option>
                      <option value="Em preparação">Em preparação</option>
                      <option value="Entregue">Entregue</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td>{p.criadoEm?.toDate ? p.criadoEm.toDate().toLocaleString("pt-BR") : ""}</td>
                  <td>
                    {p.itens.map(i => (
                      <div key={i.nome}>{i.nome} x{i.quantidade} = R$ {(i.valorUnitario * i.quantidade).toFixed(2)}</div>
                    ))}
                  </td>
                  <td>
                    <button className="excluir-btn" onClick={() => excluirPedido(p.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginação */}
          <div className="paginacao">
            <button onClick={() => mudarPagina(pedidoPagina - 1)} disabled={pedidoPagina === 1}>Anterior</button>
            <span> Página {pedidoPagina} de {totalPaginas} </span>
            <button onClick={() => mudarPagina(pedidoPagina + 1)} disabled={pedidoPagina === totalPaginas}>Próxima</button>
          </div>
        </>
      )}
    </div>
  );
}
