import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/sales.css';
import { db } from '../services/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  valorCompra: number;
  valorVenda: number;
}

interface Venda {
  id: string;
  produtoId: string;
  nome: string;
  quantidade: number;
  unidade: string;
  data: Timestamp;
  valorCompra: number;
  valorVenda: number;
  margemLucro: number;
}

const Sales = () => {
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>('');
  const [quantidadeVendida, setQuantidadeVendida] = useState<number>(0);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'produtos'));
      const lista: Produto[] = [];
      querySnapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...(docSnap.data() as Omit<Produto, 'id'>) });
      });
      setProdutos(lista);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendas = async () => {
    try {
      const q = query(collection(db, 'vendas'), orderBy('data', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const lista: Venda[] = [];
      querySnapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...(docSnap.data() as Omit<Venda, 'id'>) });
      });
      setVendas(lista);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    }
  };

  useEffect(() => {
    fetchProdutos();
    fetchVendas();
  }, []);

  const handleVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (!produto) {
      setMensagem({ tipo: 'erro', texto: 'Selecione um produto válido.' });
      return;
    }
    if (quantidadeVendida <= 0) {
      setMensagem({ tipo: 'erro', texto: 'A quantidade deve ser maior que zero.' });
      return;
    }
    if (quantidadeVendida > produto.quantidade) {
      setMensagem({ tipo: 'erro', texto: 'Quantidade insuficiente no estoque.' });
      return;
    }

    setSubmitting(true);
    try {
      const novaQuantidade = produto.quantidade - quantidadeVendida;
      await updateDoc(doc(db, 'produtos', produto.id), { quantidade: novaQuantidade });

      const margemLucro = (produto.valorVenda - produto.valorCompra) * quantidadeVendida;

      await addDoc(collection(db, 'vendas'), {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: quantidadeVendida,
        unidade: produto.unidade,
        data: Timestamp.now(),
        valorCompra: produto.valorCompra,
        valorVenda: produto.valorVenda,
        margemLucro,
      });

      setMensagem({ tipo: 'sucesso', texto: 'Venda registrada com sucesso!' });
      setQuantidadeVendida(0);
      setProdutoSelecionado('');
      fetchProdutos();
      fetchVendas();
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao registrar venda. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcluirVenda = async (venda: Venda) => {
    if (!window.confirm(`Deseja realmente excluir a venda do produto "${venda.nome}"?`)) return;

    setSubmitting(true);
    try {
      const produtoAtual = produtos.find(p => p.id === venda.produtoId);
      if (produtoAtual) {
        await updateDoc(doc(db, 'produtos', venda.produtoId), { quantidade: produtoAtual.quantidade + venda.quantidade });
      }

      await deleteDoc(doc(db, 'vendas', venda.id));
      setMensagem({ tipo: 'sucesso', texto: 'Venda excluída com sucesso!' });
      fetchProdutos();
      fetchVendas();
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao excluir venda. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-md mt-8 mb-20">
      <button
        onClick={() => navigate('/')}
        className="mb-6 px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold transition"
      >
        ← Voltar ao Menu Inicial
      </button>

      <h2 className="text-4xl font-bold mb-8 text-indigo-700 tracking-wide">Registrar Venda</h2>

      {mensagem && (
        <div
          className={`mb-6 p-4 rounded border ${
            mensagem.tipo === 'sucesso'
              ? 'bg-green-50 border-green-400 text-green-700'
              : 'bg-red-50 border-red-400 text-red-700'
          }`}
          role="alert"
        >
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleVenda} className="space-y-6">
        <label className="block">
          <span className="text-gray-700 font-medium mb-2 block">Produto</span>
          <select
            value={produtoSelecionado}
            onChange={(e) => setProdutoSelecionado(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            disabled={loading || submitting}
            required
          >
            <option value="">Selecione um produto</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome} ({produto.quantidade} {produto.unidade})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-gray-700 font-medium mb-2 block">Quantidade Vendida</span>
          <input
            type="number"
            placeholder="Digite a quantidade"
            value={quantidadeVendida}
            onChange={(e) => setQuantidadeVendida(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            min={1}
            disabled={loading || submitting}
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting || loading}
          className={`w-full py-3 rounded-lg font-semibold text-white transition shadow ${
            submitting || loading
              ? 'bg-indigo-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {submitting ? 'Registrando...' : 'Registrar Saída'}
        </button>
      </form>

      <h3 className="text-3xl font-semibold mt-12 mb-6 text-indigo-700 tracking-wide">Últimas Vendas</h3>
      {vendas.length === 0 ? (
        <p className="text-gray-600 text-center">Nenhuma venda registrada ainda.</p>
      ) : (
        <ul className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-gray-100">
          {vendas.map((venda) => (
            <li
              key={venda.id}
              className="border border-gray-300 rounded-2xl p-5 bg-gray-50 hover:bg-gray-100 transition flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <strong className="text-indigo-700 text-lg block truncate">{venda.nome}</strong>
                <p className="text-gray-700 mt-1">
                  Quantidade: <span className="font-semibold">{venda.quantidade} {venda.unidade}</span>
                </p>
                <p className="text-gray-700 mt-1 text-sm">
                  Compra: <strong>R$ {venda.valorCompra?.toFixed(2) ?? '0.00'}</strong> / Venda: <strong>R$ {venda.valorVenda?.toFixed(2) ?? '0.00'}</strong>
                </p>
                <p className={`font-semibold mt-1 ${
                    (venda.margemLucro ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  } text-sm`}>
                  Lucro: R$ {(venda.margemLucro ?? 0).toFixed(2)}
                </p>
              </div>

              <div className="flex flex-row items-center gap-3 mt-2 sm:mt-0 sm:ml-6">
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {venda.data?.toDate ? venda.data.toDate().toLocaleString() : 'Data inválida'}
                </div>
                <button
                  onClick={() => handleExcluirVenda(venda)}
                  disabled={submitting}
                  className="text-red-500 hover:text-red-800 font-semibold transition text-sm px-2 py-1 rounded"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Sales;
