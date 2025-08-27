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
  margemLucro?: number; // opcional, será calculado se não existir
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
        const data = docSnap.data() as Omit<Venda, 'id'>;
        const margemLucro = (data.valorVenda - data.valorCusto) * data.quantidade;
        lista.push({ id: docSnap.id, ...data, margemLucro });
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

      const margemLucro = (produto.valorVenda - produto.valorCusto) * quantidadeVendida;

      await addDoc(collection(db, 'vendas'), {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: quantidadeVendida,
        unidade: produto.unidade,
        data: Timestamp.now(),
        valorCusto: produto.valorCusto,
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
            {produtos.map((produto) => (
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
            onChange={(e) => setQuantidadeVendida(Number(e.target.value))}
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
          {vendas.map((venda) => (
            <li key={venda.id} className="sales-item">
              <div className="info">
                <strong>{venda.nome}</strong>
                <p>Quantidade: <span className="font-semibold">{venda.quantidade} {venda.unidade}</span></p>
                <p>Custo: R$ {venda.valorCusto?.toFixed(2) ?? '0.00'} / Venda: R$ {venda.valorVenda?.toFixed(2) ?? '0.00'}</p>
                <p className={`lucro ${venda.margemLucro! >= 0 ? 'lucro-positivo' : 'lucro-negativo'}`}>
                  Lucro: R$ {(venda.margemLucro ?? 0).toFixed(2)}
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
