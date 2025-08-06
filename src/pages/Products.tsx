import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

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
  const [form, setForm] = useState<Omit<Produto, 'id'>>({
    nome: '',
    categoria: '',
    quantidade: 0,
    unidade: '',
    valorCompra: 0,
    valorVenda: 0,
  });

  const [estoqueAdicional, setEstoqueAdicional] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'produtos'));
      const lista: Produto[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Produto, 'id'>;
        lista.push({
          id: docSnap.id,
          ...data,
          quantidade: data.quantidade ?? 0,
          valorCompra: typeof data.valorCompra === 'number' ? data.valorCompra : 0,
          valorVenda: typeof data.valorVenda === 'number' ? data.valorVenda : 0,
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.nome.trim() === '') {
      alert('Nome do produto é obrigatório.');
      return;
    }

    if (form.valorCompra < 0 || form.valorVenda < 0 || form.quantidade < 0) {
      alert('Valores e quantidade não podem ser negativos');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'produtos'), form);
      setForm({
        nome: '',
        categoria: '',
        quantidade: 0,
        unidade: '',
        valorCompra: 0,
        valorVenda: 0,
      });
      await fetchProdutos();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir este produto?');
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'produtos', id));
      await fetchProdutos();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto. Tente novamente.');
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
      const novaQuantidade = produto.quantidade + adicional;
      await updateDoc(doc(db, 'produtos', id), {
        quantidade: novaQuantidade,
      });
      setEstoqueAdicional(prev => ({ ...prev, [id]: 0 }));
      await fetchProdutos();
    } catch (error) {
      console.error('Erro ao adicionar estoque:', error);
      alert('Erro ao adicionar estoque. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center text-gray-700">
        <p>Carregando produtos, aguarde...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="mb-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
      >
        Voltar para Início
      </button>

      <h2 className="text-2xl font-bold mb-4">Cadastro de Produtos</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          className="border p-2 rounded"
          required
          disabled={submitting}
        />
        <input
          type="text"
          placeholder="Categoria"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          className="border p-2 rounded"
          disabled={submitting}
        />
        <input
          type="number"
          placeholder="Quantidade"
          value={form.quantidade}
          onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })}
          className="border p-2 rounded"
          min={0}
          disabled={submitting}
        />
        <input
          type="text"
          placeholder="Unidade (ex: cx, und)"
          value={form.unidade}
          onChange={(e) => setForm({ ...form, unidade: e.target.value })}
          className="border p-2 rounded"
          disabled={submitting}
        />
        <input
          type="number"
          placeholder="Valor de Compra"
          value={form.valorCompra}
          onChange={(e) => setForm({ ...form, valorCompra: Number(e.target.value) })}
          className="border p-2 rounded"
          min={0}
          step={0.01}
          disabled={submitting}
        />
        <input
          type="number"
          placeholder="Valor de Venda"
          value={form.valorVenda}
          onChange={(e) => setForm({ ...form, valorVenda: Number(e.target.value) })}
          className="border p-2 rounded"
          min={0}
          step={0.01}
          disabled={submitting}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded col-span-2"
          disabled={submitting}
        >
          {submitting ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </form>

      <h3 className="text-xl font-semibold mb-2">Lista de Produtos</h3>
      {produtos.length === 0 ? (
        <p>Nenhum produto cadastrado.</p>
      ) : (
        <ul className="space-y-4">
          {produtos.map((produto) => (
            <li
              key={produto.id}
              className="border p-4 rounded flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <div>
                  <strong>{produto.nome}</strong> ({produto.quantidade} {produto.unidade})
                  <br />
                  <span className="text-sm text-gray-600">Categoria: {produto.categoria}</span>
                  <br />
                  <span className="text-sm text-gray-600">
                    Compra: R$ {(produto.valorCompra ?? 0).toFixed(2)} | Venda: R$ {(produto.valorVenda ?? 0).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(produto.id)}
                  disabled={deletingId === produto.id}
                  className={`px-2 py-1 rounded text-white ${
                    deletingId === produto.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {deletingId === produto.id ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>

              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Adicionar estoque"
                  value={estoqueAdicional[produto.id] ?? ''}
                  onChange={(e) =>
                    setEstoqueAdicional(prev => ({
                      ...prev,
                      [produto.id]: Number(e.target.value),
                    }))
                  }
                  className="border p-1 rounded w-32"
                />
                <button
                  onClick={() => handleAdicionarEstoque(produto.id)}
                  className="bg-green-600 text-white px-2 py-1 rounded"
                >
                  Adicionar Estoque
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Products;