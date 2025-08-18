import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

const categoriasFixas = ['Cerveja', 'Energético', 'Destilado', 'Refrigerante', 'Alimento', 'Outros'];

interface ProdutoForm {
  nome: string;
  categoria: string;
  quantidade: number | '';
  unidade: string;
  valorCompra: number | '';
  valorVenda: number | '';
}

const AddProduct = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProdutoForm>({
    nome: '',
    categoria: '',
    quantidade: '',
    unidade: '',
    valorCompra: '',
    valorVenda: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.categoria) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'produtos'), {
        ...form,
        quantidade: Number(form.quantidade),
        valorCompra: Number(form.valorCompra),
        valorVenda: Number(form.valorVenda),
      });
      alert('Produto adicionado com sucesso!');
      navigate('/produtos');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar produto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-2xl shadow-md">
      <div className="flex justify-between items-center mb-6">
      <button
        onClick={() => navigate('/')}
        className="mb-6 px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold transition"
      >
        ← Voltar ao Menu Inicial
      </button>
        <button
          onClick={() => navigate('/produtos')}
          className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
        >
          ⬅ Voltar para Produtos
        </button>
      </div>

      <h2 className="text-3xl font-bold text-indigo-700 mb-6">Adicionar Produto</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          placeholder="Nome do produto"
          value={form.nome}
          onChange={e => setForm({ ...form, nome: e.target.value })}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none placeholder-gray-400"
          required
          disabled={submitting}
        />

        <select
          value={form.categoria}
          onChange={e => setForm({ ...form, categoria: e.target.value })}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
          required
          disabled={submitting}
        >
          <option value="">Selecione a categoria</option>
          {categoriasFixas.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Quantidade"
          value={form.quantidade}
          onChange={e => setForm({ ...form, quantidade: e.target.value === '' ? '' : Number(e.target.value) })}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none placeholder-gray-400"
          min={0}
          required
          disabled={submitting}
        />

        <input
          type="text"
          placeholder="Unidade (ex: cx, und)"
          value={form.unidade}
          onChange={e => setForm({ ...form, unidade: e.target.value })}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none placeholder-gray-400"
          required
          disabled={submitting}
        />

        <input
          type="number"
          placeholder="Valor de Compra"
          value={form.valorCompra}
          onChange={e => setForm({ ...form, valorCompra: e.target.value === '' ? '' : Number(e.target.value) })}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none placeholder-gray-400"
          min={0}
          step={0.01}
          required
          disabled={submitting}
        />

        <input
          type="number"
          placeholder="Valor de Venda"
          value={form.valorVenda}
          onChange={e => setForm({ ...form, valorVenda: e.target.value === '' ? '' : Number(e.target.value) })}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none placeholder-gray-400"
          min={0}
          step={0.01}
          required
          disabled={submitting}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
        >
          {submitting ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
