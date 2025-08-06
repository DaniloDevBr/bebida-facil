// src/pages/Estoque.tsx

import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  valorCompra: number;
  valorVenda: number;
};

export default function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [agrupadoPorCategoria, setAgrupadoPorCategoria] = useState<Record<string, Produto[]>>({});

  useEffect(() => {
    const fetchProdutos = async () => {
      const produtosRef = collection(db, 'produtos');
      const snapshot = await getDocs(produtosRef);
      const lista: Produto[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto));
      setProdutos(lista);
    };

    fetchProdutos();
  }, []);

  useEffect(() => {
    const agrupado: Record<string, Produto[]> = {};
    produtos.forEach(prod => {
      if (!agrupado[prod.categoria]) agrupado[prod.categoria] = [];
      agrupado[prod.categoria].push(prod);
    });
    setAgrupadoPorCategoria(agrupado);
  }, [produtos]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Estoque por Categoria</h2>
      {Object.entries(agrupadoPorCategoria).map(([categoria, produtos]) => (
        <div key={categoria} className="mb-6">
          <h3 className="text-lg font-semibold">{categoria}</h3>
          <table className="w-full mt-2 border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Produto</th>
                <th className="border px-4 py-2">Qtd.</th>
                <th className="border px-4 py-2">Valor Compra</th>
                <th className="border px-4 py-2">Valor Venda</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(prod => (
                <tr key={prod.id}>
                  <td className="border px-4 py-2">{prod.nome}</td>
                  <td className="border px-4 py-2">{prod.quantidade}</td>
                  <td className="border px-4 py-2">R$ {prod.valorCompra.toFixed(2)}</td>
                  <td className="border px-4 py-2">R$ {prod.valorVenda.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
