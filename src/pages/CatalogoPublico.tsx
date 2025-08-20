import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/catalogoPublico.css";

interface Produto {
  id: string;
  nome: string;
  valorVenda: number;
  unidade: string;
  categoria: string;
  estoque: number;
  imagemURL?: string;
}

const CatalogoPublico: React.FC = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todas");
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    const produtosRef = collection(db, "produtos");
    const unsubscribe = onSnapshot(produtosRef, snapshot => {
      const lista: Produto[] = [];
      const categoriasSet = new Set<string>();

      snapshot.forEach(doc => {
        const data = doc.data();
        const estoqueNum = Number(data.estoque) || 0; // garante número

        lista.push({
          id: doc.id,
          nome: data.nome || "Sem Nome",
          valorVenda: Number(data.valorVenda) || 0,
          unidade: data.unidade || "un",
          categoria: data.categoria || "Sem Categoria",
          estoque: estoqueNum,
          imagemURL: data.imagemURL || "",
        });

        categoriasSet.add(data.categoria || "Sem Categoria");
      });

      setProdutos(lista);
      setCategorias(["Todas", ...Array.from(categoriasSet)]);
    });

    return () => unsubscribe();
  }, []);

  const produtosFiltrados = categoriaSelecionada === "Todas"
    ? produtos
    : produtos.filter(p => p.categoria === categoriaSelecionada);

  return (
    <div className="catalogo-publico-container">
      <div className="catalogo-header">
        <h1>Catálogo Público</h1>
        <button className="btn-voltar" onClick={() => navigate(-1)}>Voltar</button>
      </div>

      <div className="menu-categorias">
        {categorias.map(cat => (
          <button
            key={cat}
            className={`btn-categoria ${categoriaSelecionada === cat ? "ativo" : ""}`}
            onClick={() => setCategoriaSelecionada(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="produtos-grid">
        {produtosFiltrados.map(produto => (
          <div key={produto.id} className="card-produto">
            {produto.imagemURL && <img src={produto.imagemURL} alt={produto.nome} />}
            <h3>{produto.nome}</h3>
            <p>R$ {produto.valorVenda.toFixed(2)}</p>
            <p className="estoque">Estoque: {produto.estoque}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CatalogoPublico;
