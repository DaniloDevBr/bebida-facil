import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  estoque: number; // Padronizado para o cliente
  valorCompra: number;
  valorVenda: number;
};

export default function Estoque() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [agrupadoPorCategoria, setAgrupadoPorCategoria] = useState<Record<string, Produto[]>>({});

  useEffect(() => {
    const fetchProdutos = async () => {
      const produtosRef = collection(db, 'produtos');
      const snapshot = await getDocs(produtosRef);
      const lista: Produto[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.nome || "Sem Nome",
          categoria: data.categoria || "Sem Categoria",
          estoque: Number(data.quantidade || 0), // Converter para estoque
          valorCompra: Number(data.valorCompra || 0),
          valorVenda: Number(data.valorVenda || 0),
        };
      });
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
    <div className="min-h-screen p-6 max-w-5xl mx-auto bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-3 items-center">
          <button
            onClick={() => navigate('/')}
            className="mb-6 px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold transition"
          >
            ← Voltar ao Menu Inicial
          </button>
          <h2 className="text-3xl font-bold text-indigo-700">Estoque por Categoria</h2>
        </div>
      </div>

      {Object.entries(agrupadoPorCategoria).length === 0 && (
        <p className="text-center text-gray-500">Nenhum produto encontrado.</p>
      )}

      {Object.entries(agrupadoPorCategoria).map(([categoria, produtos]) => (
        <section key={categoria} className="mb-10">
          <h3 className="text-xl font-semibold mb-4 border-b border-indigo-300 pb-1 text-indigo-600">{categoria}</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-gray-200 rounded-md">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-6 py-3 border-b border-gray-300">Produto</th>
                  <th className="px-6 py-3 border-b border-gray-300 w-20">Estoque</th>
                  <th className="px-6 py-3 border-b border-gray-300 w-32">Valor Compra</th>
                  <th className="px-6 py-3 border-b border-gray-300 w-32">Valor Venda</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(prod => (
                  <tr key={prod.id} className="hover:bg-indigo-100 transition-colors">
                    <td className="px-6 py-3 border-b border-gray-200">{prod.nome}</td>
                    <td className="px-6 py-3 border-b border-gray-200">{prod.estoque}</td>
                    <td className="px-6 py-3 border-b border-gray-200">R$ {prod.valorCompra.toFixed(2)}</td>
                    <td className="px-6 py-3 border-b border-gray-200">R$ {prod.valorVenda.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
