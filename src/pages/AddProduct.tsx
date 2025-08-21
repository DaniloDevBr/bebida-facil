// src/pages/AddProduct.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import '../styles/AddProduct.css';
import { collection, addDoc } from 'firebase/firestore';

const categoriasFixas = ['Cerveja', 'Energético', 'Destilado', 'Refrigerante', 'Porções', 'Outros'];

interface ProdutoForm {
  nome: string;
  categoria: string;
  quantidade: number | '';
  unidade: string;
  valorCompra: number | '';
  valorVenda: number | '';
}

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProdutoForm>({
    nome: '',
    categoria: '',
    quantidade: '',
    unidade: '',
    valorCompra: '',
    valorVenda: '',
  });
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Atualiza preview ao selecionar imagem
  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagemFile(e.target.files[0]);
      setPreviewURL(URL.createObjectURL(e.target.files[0]));
    } else {
      setImagemFile(null);
      setPreviewURL(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.categoria) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    setSubmitting(true);

    try {
      let imagemBase64 = '';
      if (imagemFile) {
        const reader = new FileReader();
        imagemBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(imagemFile);
        });
      }

      await addDoc(collection(db, 'produtos'), {
        ...form,
        quantidade: Number(form.quantidade),
        valorCompra: Number(form.valorCompra),
        valorVenda: Number(form.valorVenda),
        imagemBase64, // salva a imagem em Base64
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
    <div className="add-product-container p-6">
      <div className="add-product-header mb-6">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold transition"
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

      <h2 className="add-product-title">Adicionar Produto</h2>

      <form onSubmit={handleSubmit} className="add-product-form">
        <input
          type="text"
          placeholder="Nome do produto"
          value={form.nome}
          onChange={e => setForm({ ...form, nome: e.target.value })}
          disabled={submitting}
          required
        />

        <select
          value={form.categoria}
          onChange={e => setForm({ ...form, categoria: e.target.value })}
          disabled={submitting}
          required
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
          min={0}
          disabled={submitting}
          required
        />

        <input
          type="text"
          placeholder="Unidade (ex: cx, und)"
          value={form.unidade}
          onChange={e => setForm({ ...form, unidade: e.target.value })}
          disabled={submitting}
          required
        />

        <input
          type="number"
          placeholder="Valor de Compra"
          value={form.valorCompra}
          onChange={e => setForm({ ...form, valorCompra: e.target.value === '' ? '' : Number(e.target.value) })}
          min={0}
          step={0.01}
          disabled={submitting}
          required
        />

        <input
          type="number"
          placeholder="Valor de Venda"
          value={form.valorVenda}
          onChange={e => setForm({ ...form, valorVenda: e.target.value === '' ? '' : Number(e.target.value) })}
          min={0}
          step={0.01}
          disabled={submitting}
          required
        />

        {/* Upload de imagem */}
        <div>
          <label>Imagem do Produto</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImagemChange}
            disabled={submitting}
          />
          {previewURL && (
            <img
              src={previewURL}
              alt="Preview"
              className="image-preview"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
