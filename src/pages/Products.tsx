import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  valorCompra: number;
  valorVenda: number;
}

const Products = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [estoqueAdicional, setEstoqueAdicional] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'produtos'));
      const lista: Produto[] = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Produto, 'id'>)
      }));
      setProdutos(lista);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'produtos', id));
      await fetchProdutos();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdicionarEstoque = async (id: string) => {
    const adicional = estoqueAdicional[id];
    if (!adicional || adicional <= 0) {
      alert('Informe uma quantidade válida para adicionar.');
      return;
    }
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    try {
      await updateDoc(doc(db, 'produtos', id), {
        quantidade: produto.quantidade + adicional
      });
      setEstoqueAdicional(prev => ({ ...prev, [id]: 0 }));
      fetchProdutos();
    } catch (error) {
      console.error('Erro ao adicionar estoque:', error);
    }
  };

  if (loading) return <div className="text-center p-6 text-gray-700">Carregando produtos...</div>;

  return (
    <div className="content">
      <div className="header-actions">
        <button
          onClick={() => navigate('/')}
          className="btn-back"
        >
          ← Voltar ao Menu Inicial
        </button>
        <h1 className="page-title">Produtos</h1>
        <button
          onClick={() => navigate('/produtos/adicionar')}
          className="btn-add"
        >
          + Adicionar Produto
        </button>
      </div>

      {produtos.length === 0 ? (
        <p className="empty-message">Nenhum produto cadastrado.</p>
      ) : (
        <ul className="cards-grid">
          {produtos.map(produto => (
            <li key={produto.id} className="card-item">
              <div>
                <h2 className="card-title">{produto.nome}</h2>
                <p className="card-category">Categoria: {produto.categoria}</p>
                <p className="card-quantity">
                  Quantidade: <span>{produto.quantidade}</span> {produto.unidade}
                </p>
                <p className="card-values">
                  Compra: <span>R$ {produto.valorCompra.toFixed(2)}</span> | Venda: <span>R$ {produto.valorVenda.toFixed(2)}</span>
                </p>
              </div>

              <div className="card-actions">
                <button
                  onClick={() => handleDelete(produto.id)}
                  disabled={deletingId === produto.id}
                  className={`btn-delete ${deletingId === produto.id ? 'disabled' : ''}`}
                >
                  {deletingId === produto.id ? 'Excluindo...' : 'Excluir'}
                </button>
                <div className="add-stock">
                  <input
                    type="number"
                    placeholder="Qtd"
                    value={estoqueAdicional[produto.id] ?? ''}
                    onChange={e =>
                      setEstoqueAdicional(prev => ({ ...prev, [produto.id]: Number(e.target.value) }))
                    }
                    min={0}
                  />
                  <button onClick={() => handleAdicionarEstoque(produto.id)} className="btn-add-stock">+</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Products;
