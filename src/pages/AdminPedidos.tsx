// src/pages/AdminPedidos.tsx
import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface PedidoItem {
  produtoId: string;
  nome: string;
  qtd: number;
  preco: number;
}

interface Pedido {
  id: string;
  clienteId: string;
  itens: PedidoItem[];
  status: string;
  total: number;
  criadoEm: any;
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'pedidos'), snapshot => {
      const lista: Pedido[] = snapshot.docs.map(docSnap => {
        const { id, ...rest } = docSnap.data() as Pedido;
        return { id: docSnap.id, ...rest };
      });
      setPedidos(lista);
    });
    return () => unsubscribe();
  }, []);

  const handleAtualizarStatus = async (pedido: Pedido, novoStatus: string) => {
    await updateDoc(doc(db, 'pedidos', pedido.id), { status: novoStatus });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-indigo-700">Pedidos Recebidos</h2>
      {pedidos.length === 0 ? (
        <p>Nenhum pedido ainda.</p>
      ) : (
        <ul className="space-y-4">
          {pedidos.map(p => (
            <li key={p.id} className="border p-4 rounded-lg flex flex-col gap-2">
              <div>
                <strong>Cliente: {p.clienteId}</strong> | Status:{' '}
                <span className="font-semibold">{p.status}</span>
              </div>
              <ul className="ml-4 list-disc">
                {p.itens.map(i => (
                  <li key={i.produtoId}>
                    {i.nome} x{i.qtd} - R$ {i.preco.toFixed(2)}
                  </li>
                ))}
              </ul>
              <p>Total: R$ {p.total.toFixed(2)}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleAtualizarStatus(p, 'aceito')}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Aceitar
                </button>
                <button
                  onClick={() => handleAtualizarStatus(p, 'em_entrega')}
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
                >
                  Em Entrega
                </button>
                <button
                  onClick={() => handleAtualizarStatus(p, 'concluido')}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Concluído
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
