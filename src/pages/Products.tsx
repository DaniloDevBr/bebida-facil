// src/pages/Products.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import '../styles/Products.css';

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  valorCusto: number;
  valorVenda: number;
  imagemURL?: string;
  imagemBase64?: string;
}

const Products = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [estoqueAdicional, setEstoqueAdicional] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, Partial<Produto>>>({});

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'produtos'));
      const lista: Produto[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nome: data.nome,
          categoria: data.categoria || 'Sem Categoria',
          quantidade: data.quantidade !== undefined ? Number(data.quantidade) : 0,
          unidade: data.unidade || 'un',
          valorCusto: Number(data.valorCusto) || 0,
          valorVenda: Number(data.valorVenda) || 0,
          imagemURL: data.imagemURL || '',
          imagemBase64: data.imagemBase64 || '',
        };
      });
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

  const handleChangeField = (id: string, field: keyof Produto, value: any) => {
    setEditing(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleChangeImage = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setEditing(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          imagemBase64: reader.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (id: string) => {
    const changes = editing[id];
    if (!changes) return;

    try {
      await updateDoc(doc(db, 'produtos', id), {
        ...changes
      });
      alert('Produto atualizado com sucesso!');
      setEditing(prev => {
        const newEditing = { ...prev };
        delete newEditing[id];
        return newEditing;
      });
      fetchProdutos();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
    }
  };

  if (loading) return <div className="text-center p-6 text-gray-700">Carregando produtos...</div>;

  const categorias = Array.from(new Set(produtos.map(p => p.categoria)));

  return (
    <div className="content">
      <div className="header-actions">
        <button onClick={() => navigate('/')} className="btn-back">← Voltar ao Menu Inicial</button>
        <h1 className="page-title">Produtos</h1>
        <button onClick={() => navigate('/produtos/adicionar')} className="btn-add">+ Adicionar Produto</button>
      </div>

      {produtos.length === 0 ? (
        <p className="empty-message">Nenhum produto cadastrado.</p>
      ) : (
        categorias.map(categoria => (
          <div key={categoria} className="categoria-section">
            <h2 className="categoria-title">{categoria}</h2>
            <ul className="cards-grid">
              {produtos
                .filter(p => p.categoria === categoria)
                .map(produto => {
                  const editData = editing[produto.id] || {};
                  return (
                    <li key={produto.id} className="card-item">
                      <div className="card-img-container">
                        {(editData.imagemBase64 || produto.imagemBase64 || produto.imagemURL) ? (
                          <img
                            src={editData.imagemBase64 || produto.imagemBase64 || produto.imagemURL}
                            alt={produto.nome}
                            className="card-img"
                            style={{
                              width: "150px",
                              height: "150px",
                              objectFit: "contain",
                              backgroundColor: "#f5f5f5",
                              borderRadius: "8px"
                            }}
                          />
                        ) : (
                          <div
                            className="card-no-img"
                            style={{
                              width: "150px",
                              height: "150px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#eee",
                              borderRadius: "8px"
                            }}
                          >
                            Sem Imagem
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleChangeImage(produto.id, e.target.files[0]);
                            }
                          }}
                        />
                      </div>

                      <div>
                        <h3 className="card-title">{produto.nome}</h3>
                        <p className="card-quantity">
                          Estoque: <span>{produto.quantidade}</span> {produto.unidade}
                        </p>
                        <p className="card-values">
                          Custo: 
                          <input
                            type="number"
                            value={editData.valorCusto ?? produto.valorCusto}
                            onChange={e => handleChangeField(produto.id, "valorCusto", Number(e.target.value))}
                          />
                          | Venda: 
                          <input
                            type="number"
                            value={editData.valorVenda ?? produto.valorVenda}
                            onChange={e => handleChangeField(produto.id, "valorVenda", Number(e.target.value))}
                          />
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

                        {editing[produto.id] && (
                          <button
                            onClick={() => handleSave(produto.id)}
                            className="btn-save"
                          >
                            Salvar Alterações
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default Products;
