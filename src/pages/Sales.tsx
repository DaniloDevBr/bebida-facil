// src/pages/Sales.tsx
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
  onSnapshot,
  getDoc,
} from 'firebase/firestore';

interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  valorCusto: number;
  valorVenda: number;
}

interface Venda {
  id: string;
  produtoId: string;
  nome: string;
  quantidade: number;
  unidade: string;
  data: Timestamp;
  valorCusto: number;
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

  // 🔄 Buscar produtos
  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'produtos'));
      const lista: Produto[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        lista.push({
          id: docSnap.id,
          nome: data.nome || 'Produto sem nome',
          quantidade: Number(data.quantidade) || 0,
          unidade: data.unidade || '',
          valorCusto: Number(data.valorCusto ?? 0),
          valorVenda: Number(data.valorVenda ?? 0),
        });
      });
      setProdutos(lista);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔎 Escuta vendas em tempo real
  const listenVendas = () => {
    const vendasRef = collection(db, 'vendas');
    const q = query(vendasRef, orderBy('data', 'desc'), limit(50));
    return onSnapshot(q, snapshot => {
      const lista: Venda[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();

        const quantidade = Number(data.quantidade ?? 0);
        const valorVenda = Number(data.valorVenda ?? 0);

        // Pega o produto correspondente do estoque
        const produtoEstoque = produtos.find(p => p.id === data.produtoId);

        const valorCusto = produtoEstoque ? produtoEstoque.valorCusto : Number(data.valorCusto ?? 0);
        const margemLucro = (valorVenda - valorCusto) * quantidade;

        return {
          id: docSnap.id,
          produtoId: data.produtoId || '',
          nome: data.nome || 'Produto sem nome',
          quantidade,
          unidade: data.unidade || '',
          data: data.data || Timestamp.now(),
          valorCusto,
          valorVenda,
          margemLucro,
        };
      });
      setVendas(lista);
    });
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  useEffect(() => {
    const unsubscribe = listenVendas();
    return () => unsubscribe();
  }, [produtos]); // Dependência garante que o lucro seja calculado corretamente

  // 🛒 Registrar venda manual
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

      const valorCusto = produto.valorCusto;
      const valorVenda = produto.valorVenda;
      const margemLucro = (valorVenda - valorCusto) * quantidadeVendida;

      await addDoc(collection(db, 'vendas'), {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: quantidadeVendida,
        unidade: produto.unidade,
        data: Timestamp.now(),
        valorCusto,
        valorVenda,
        margemLucro,
      });

      setMensagem({ tipo: 'sucesso', texto: 'Venda registrada com sucesso!' });
      setQuantidadeVendida(0);
      setProdutoSelecionado('');
      fetchProdutos();
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao registrar venda. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ❌ Excluir venda
  const handleExcluirVenda = async (venda: Venda) => {
    if (!window.confirm(`Deseja realmente excluir a venda do produto "${venda.nome}"?`)) return;

    setSubmitting(true);
    try {
      const produtoRef = doc(db, 'produtos', venda.produtoId);
      const produtoSnap = await getDoc(produtoRef);

      if (produtoSnap.exists()) {
        const produtoData = produtoSnap.data();
        const quantidadeAtual = Number(produtoData.quantidade ?? 0);
        await updateDoc(produtoRef, { quantidade: quantidadeAtual + venda.quantidade });
      }

      await deleteDoc(doc(db, 'vendas', venda.id));
      setMensagem({ tipo: 'sucesso', texto: 'Venda excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao excluir venda. Tente novamente.' });
    } finally {
      setSubmitting(false);
      fetchProdutos(); // atualizar lista
    }
  };

  return (
    <div className="sales-container">
      <button onClick={() => navigate('/')} className="back-btn">← Voltar ao Menu Inicial</button>

      <h2>Registrar Venda</h2>

      {mensagem && (
        <div className={`alert ${mensagem.tipo === 'sucesso' ? 'alert-success' : 'alert-error'}`} role="alert">
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleVenda}>
        <label>
          <span>Produto</span>
          <select
            value={produtoSelecionado}
            onChange={(e) => setProdutoSelecionado(e.target.value)}
            disabled={loading || submitting}
            required
          >
            <option value="">Selecione um produto</option>
            {produtos.map(produto => (
              <option key={produto.id} value={produto.id}>
                {produto.nome} ({produto.quantidade} {produto.unidade})
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Quantidade Vendida</span>
          <input
            type="number"
            placeholder="Digite a quantidade"
            value={quantidadeVendida}
            onChange={e => setQuantidadeVendida(Number(e.target.value))}
            min={1}
            disabled={loading || submitting}
            required
          />
        </label>

        <button type="submit" disabled={submitting || loading}>
          {submitting ? 'Registrando...' : 'Registrar Saída'}
        </button>
      </form>

      <h3>Últimas Vendas</h3>
      {vendas.length === 0 ? (
        <p className="text-center">Nenhuma venda registrada ainda.</p>
      ) : (
        <ul className="sales-list">
          {vendas.map(venda => (
            <li key={venda.id} className="sales-item">
              <div className="info">
                <strong>{venda.nome}</strong>
                <p>Quantidade: <span className="font-semibold">{venda.quantidade} {venda.unidade}</span></p>
                <p>Custo: R$ {venda.valorCusto.toFixed(2)} / Venda: R$ {venda.valorVenda.toFixed(2)}</p>
                <p className={`lucro ${venda.margemLucro >= 0 ? 'lucro-positivo' : 'lucro-negativo'}`}>
                  Lucro: R$ {venda.margemLucro.toFixed(2)}
                </p>
              </div>

              <div className="actions">
                <div className="data">{venda.data?.toDate ? venda.data.toDate().toLocaleString() : 'Data inválida'}</div>
                <button onClick={() => handleExcluirVenda(venda)} disabled={submitting}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Sales;
