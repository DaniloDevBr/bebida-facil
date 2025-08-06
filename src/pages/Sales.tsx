import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
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

  const fetchProdutos = async () => {
    const querySnapshot = await getDocs(collection(db, 'produtos'));
    const lista: Produto[] = [];
    querySnapshot.forEach((docSnap) => {
      lista.push({ id: docSnap.id, ...(docSnap.data() as Omit<Produto, 'id'>) });
    });
    setProdutos(lista);
  };

  const fetchVendas = async () => {
    const q = query(collection(db, 'vendas'), orderBy('data', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    const lista: Venda[] = [];
    querySnapshot.forEach((docSnap) => {
      lista.push({ id: docSnap.id, ...(docSnap.data() as Omit<Venda, 'id'>) });
    });
    setVendas(lista);
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
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="mb-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
      >
        Voltar para Início
      </button>

      <h2 className="text-2xl font-bold mb-4">Registrar Venda</h2>

      {mensagem && (
        <div
          className={`mb-4 p-3 rounded ${
            mensagem.tipo === 'sucesso' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleVenda} className="space-y-4">
        <select
          value={produtoSelecionado}
          onChange={(e) => setProdutoSelecionado(e.target.value)}
          className="border p-2 rounded w-full"
          required
        >
          <option value="">Selecione um produto</option>
          {produtos.map((produto) => (
            <option key={produto.id} value={produto.id}>
              {produto.nome} ({produto.quantidade} {produto.unidade})
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Quantidade vendida"
          value={quantidadeVendida}
          onChange={(e) => setQuantidadeVendida(Number(e.target.value))}
          className="border p-2 rounded w-full"
          required
          min={1}
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Registrar Saída
        </button>
      </form>

      <h3 className="text-xl font-semibold mt-8 mb-3">Últimas Vendas</h3>
      {vendas.length === 0 ? (
        <p>Nenhuma venda registrada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {vendas.map((venda) => (
            <li key={venda.id} className="border p-2 rounded">
              <strong>{venda.nome}</strong> — {venda.quantidade} {venda.unidade} —{' '}
              R$ {(venda.valorVenda ?? 0).toFixed(2)} venda / R$ {(venda.valorCompra ?? 0).toFixed(2)} compra —{' '}
              <span
                className={
                  (venda.margemLucro ?? 0) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
                }
              >
                Lucro: R$ {(venda.margemLucro ?? 0).toFixed(2)}
              </span>{' '}
              — {venda.data?.toDate ? venda.data.toDate().toLocaleString() : 'Data inválida'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Sales;
