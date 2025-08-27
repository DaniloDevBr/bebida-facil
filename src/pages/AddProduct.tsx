// src/pages/AddProduct.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import '../styles/AddProduct.css';
import { collection, addDoc } from 'firebase/firestore';

const categoriasFixas = ['Cerveja', 'Energético', 'Destilado', 'Refrigerante', 'Porções', 'Outros'];
const unidadesFixas = ['und', 'caixa', 'fardo', 'kg', 'g'];

interface ProdutoForm {
  nome: string;
  categoria: string;
  quantidade: number | '';
  unidade: string;
  valorCusto: number | '';
  valorVenda: number | '';
}

// 🔹 Redimensiona mantendo proporção, sem cortar nem ampliar
const resizeImage = (file: File, maxWidth = 150, maxHeight = 150): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Erro ao processar imagem.");

        canvas.width = maxWidth;
        canvas.height = maxHeight;

        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        const offsetX = (maxWidth - newWidth) / 2;
        const offsetY = (maxHeight - newHeight) / 2;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, maxWidth, maxHeight);

        ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProdutoForm>({
    nome: '',
    categoria: '',
    quantidade: '',
    unidade: '',
    valorCusto: '',
    valorVenda: '',
  });
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImagemChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resizedBase64 = await resizeImage(file, 150, 150);
        setImagemFile(file);
        setPreviewURL(resizedBase64);
      } catch (error) {
        console.error("Erro ao redimensionar imagem:", error);
      }
    } else {
      setImagemFile(null);
      setPreviewURL(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.categoria || !form.unidade) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    setSubmitting(true);

    try {
      let imagemBase64 = '';
      if (imagemFile) {
        imagemBase64 = await resizeImage(imagemFile, 150, 150);
      }

      await addDoc(collection(db, 'produtos'), {
        ...form,
        quantidade: Number(form.quantidade),
        valorCompra: Number(form.valorCusto),
        valorVenda: Number(form.valorVenda),
        imagemBase64,
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

  // 🔹 Estilo uniforme para todos os inputs e selects
  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontSize: '1.2rem',
    padding: '1rem',
    minHeight: '50px',
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div className="add-product-container">
      <div className="add-product-header">
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
          style={inputStyle}
        />

        <select
          value={form.categoria}
          onChange={e => setForm({ ...form, categoria: e.target.value })}
          disabled={submitting}
          required
          style={inputStyle}
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
          style={inputStyle}
        />

        <select
          value={form.unidade}
          onChange={e => setForm({ ...form, unidade: e.target.value })}
          disabled={submitting}
          required
          style={inputStyle}
        >
          <option value="">Selecione a unidade</option>
          {unidadesFixas.map(unidade => (
            <option key={unidade} value={unidade}>{unidade}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Valor de Custo"
          value={form.valorCusto}
          onChange={e => setForm({ ...form, valorCusto: e.target.value === '' ? '' : Number(e.target.value) })}
          min={0}
          step={0.01}
          disabled={submitting}
          required
          style={inputStyle}
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
          style={inputStyle}
        />

        {/* Upload de imagem */}
        <div>
          <label>Imagem do Produto</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImagemChange}
            disabled={submitting}
            style={{ marginTop: '0.5rem' }}
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
          style={{ fontSize: '1.15rem', padding: '1rem 2rem', marginTop: '1rem' }}
        >
          {submitting ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
