// src/pages/PedidosCliente.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../services/AuthContext';
import '../styles/pedidosCliente.css';

interface Produto {
  id: string;
  nome: string;
  valorVenda: number;
  unidade: string;
  quantidade: number;
  categoria: string;
  imagemURL?: string;
}

interface ItemCarrinho extends Produto {
  quantidadeSelecionada: number;
}

export default function PedidosCliente() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'produtos'));
        const lista: Produto[] = [];
        const categoriasSet = new Set<string>();

        snapshot.forEach(doc => {
          const data = doc.data() as Partial<Produto>;
          if (!data.nome || data.valorVenda === undefined) return;
          const produto: Produto = {
            id: doc.id,
            nome: data.nome,
            valorVenda: data.valorVenda,
            unidade: data.unidade || '',
            quantidade: data.quantidade || 0,
            categoria: data.categoria || 'Sem categoria',
            imagemURL: data.imagemURL || ''
          };
          lista.push(produto);
          categoriasSet.add(produto.categoria);
        });

        setProdutos(lista);
        setCategorias(['Todas', ...Array.from(categoriasSet)]);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }

      // Recuperar carrinho do localStorage
      try {
        const savedCart = localStorage.getItem('carrinho');
        if (savedCart) setCarrinho(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem('carrinho');
      }
    };

    fetch();
  }, []);

  const adicionarCarrinho = (produto: Produto) => {
    const existe = carrinho.find(item => item.id === produto.id);
    let novoCarrinho: ItemCarrinho[];
    if (existe) {
      novoCarrinho = carrinho.map(item =>
        item.id === produto.id
          ? { ...item, quantidadeSelecionada: item.quantidadeSelecionada + 1 }
          : item
      );
    } else {
      novoCarrinho = [...carrinho, { ...produto, quantidadeSelecionada: 1 }];
    }
    setCarrinho(novoCarrinho);
    localStorage.setItem('carrinho', JSON.stringify(novoCarrinho));
  };

  const removerItem = (produtoId: string) => {
    const novoCarrinho = carrinho.filter(item => item.id !== produtoId);
    setCarrinho(novoCarrinho);
    localStorage.setItem('carrinho', JSON.stringify(novoCarrinho));
  };

  const totalCarrinho = carrinho.reduce(
    (acc, item) => acc + item.valorVenda * item.quantidadeSelecionada,
    0
  );

  const enviarPedido = async () => {
    if (!user || carrinho.length === 0) {
      setMensagem('Adicione produtos ao carrinho antes de enviar.');
      return;
    }

    try {
      await addDoc(collection(db, 'pedidos'), {
        clienteId: user.uid,
        clienteNome: user.displayName || 'Cliente', // ✅ Adicionado
        itens: carrinho.map(item => ({
          nome: item.nome,
          quantidade: item.quantidadeSelecionada,
          preco: item.valorVenda,
        })),
        total: totalCarrinho,
        status: 'pendente',
        criadoEm: Timestamp.now(),
      });

      setMensagem('Pedido enviado com sucesso!');
      setCarrinho([]);
      localStorage.removeItem('carrinho');
    } catch (error) {
      console.error(error);
      setMensagem('Erro ao enviar pedido.');
    }
  };

  const produtosFiltrados =
    categoriaSelecionada === 'Todas'
      ? produtos
      : produtos.filter(p => p.categoria === categoriaSelecionada);

  return (
    <div className="catalogo-container">
      <h1>Catálogo da Adega</h1>
      {mensagem && <div className="mensagem">{mensagem}</div>}

      {/* Menu de categorias */}
      <div className="categorias-menu mb-6">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaSelecionada(cat)}
            className={`categoria-btn ${categoriaSelecionada === cat ? 'ativa' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Produtos */}
      <div className="produtos-grid">
        {produtosFiltrados.map(produto => (
          <div key={produto.id} className="card-produto">
            {produto.imagemURL && <img src={produto.imagemURL} alt={produto.nome} />}
            <h3>{produto.nome}</h3>
            <p>R$ {produto.valorVenda.toFixed(2)}</p>
            <p>Qtd disponível: {produto.quantidade}</p>
            <button onClick={() => adicionarCarrinho(produto)}>Adicionar ao Carrinho</button>
          </div>
        ))}
      </div>

      {/* Carrinho fixo lateral */}
      <div className="carrinho-fixo">
        <h2>Carrinho</h2>
        {carrinho.length === 0 ? (
          <p>O carrinho está vazio.</p>
        ) : (
          <ul>
            {carrinho.map(item => (
              <li key={item.id}>
                {item.nome} x {item.quantidadeSelecionada} - R$ {(item.valorVenda * item.quantidadeSelecionada).toFixed(2)}
                <button className="remover" onClick={() => removerItem(item.id)}>Excluir</button>
              </li>
            ))}
          </ul>
        )}
        <p className="total">Total: R$ {totalCarrinho.toFixed(2)}</p>

        <button className="enviar-pedido" onClick={enviarPedido}>
          Finalizar Pedido
        </button>
      </div>
    </div>
  );
}
