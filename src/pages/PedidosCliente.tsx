// src/pages/PedidosCliente.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
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

interface Pedido {
  id: string;
  clienteNome: string;
  clienteId: string;
  itens: { nome: string; quantidade: number; valorUnitario: number }[];
  total: number;
  status: string;
  criadoEm: any;
}

export default function PedidosCliente() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [mostrarPedidos, setMostrarPedidos] = useState(false);
  const [pedidosCliente, setPedidosCliente] = useState<Pedido[]>([]);
  const [quantidades, setQuantidades] = useState<{ [key: string]: number }>({});

  // 🔄 Carregar produtos
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const produtosRef = collection(db, 'produtos');
        const querySnapshot = await getDocs(produtosRef);
        const lista: Produto[] = [];
        const categoriasSet = new Set<string>();

        querySnapshot.forEach(doc => {
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
        if (savedCart) {
          const parsedCart: ItemCarrinho[] = JSON.parse(savedCart);
          setCarrinho(parsedCart);

          const initialQuantities: { [key: string]: number } = {};
          parsedCart.forEach(item => {
            initialQuantities[item.id] = item.quantidadeSelecionada;
          });
          setQuantidades(initialQuantities);
        }
      } catch {
        localStorage.removeItem('carrinho');
      }
    };

    fetchProdutos();
  }, []);

  // 🔎 Escuta pedidos do cliente
  useEffect(() => {
    if (!user) return;

    const pedidosRef = collection(db, 'pedidos');
    const q = query(
      pedidosRef,
      where('clienteId', '==', user.uid),
      orderBy('criadoEm', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const lista: Pedido[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as Omit<Pedido, 'id'>;
        return {
          id: docSnap.id,
          ...data,
          itens: data.itens?.map(i => ({
            nome: i.nome,
            quantidade: i.quantidade,
            valorUnitario: i.valorUnitario // ⚡ corrigido aqui
          })) || []
        };
      });
      setPedidosCliente(lista);
    });

    return () => unsubscribe();
  }, [user]);

  // ➕ Adicionar ao carrinho
  const adicionarCarrinho = (produto: Produto, quantidade = 1) => {
    const prodAtual = produtos.find(p => p.id === produto.id);
    if (!prodAtual || quantidade <= 0 || quantidade > prodAtual.quantidade) {
      alert(`Quantidade inválida! Máximo disponível: ${prodAtual?.quantidade || 0}`);
      return;
    }

    const existe = carrinho.find(item => item.id === produto.id);
    let novoCarrinho: ItemCarrinho[];

    if (existe) {
      const totalQuantidade = existe.quantidadeSelecionada + quantidade;
      if (totalQuantidade > prodAtual.quantidade) {
        alert(`Estoque insuficiente! Máximo disponível: ${prodAtual.quantidade}`);
        return;
      }
      novoCarrinho = carrinho.map(item =>
        item.id === produto.id ? { ...item, quantidadeSelecionada: totalQuantidade } : item
      );
    } else {
      novoCarrinho = [...carrinho, { ...produto, quantidadeSelecionada: quantidade }];
    }

    setCarrinho(novoCarrinho);
    localStorage.setItem('carrinho', JSON.stringify(novoCarrinho));
    setQuantidades(prev => ({ ...prev, [produto.id]: 1 }));
  };

  // ❌ Remover item do carrinho
  const removerItem = (produtoId: string) => {
    const novoCarrinho = carrinho.filter(item => item.id !== produtoId);
    setCarrinho(novoCarrinho);
    localStorage.setItem('carrinho', JSON.stringify(novoCarrinho));
  };

  const totalCarrinho = carrinho.reduce(
    (acc, item) => acc + item.valorVenda * item.quantidadeSelecionada,
    0
  );

  // 🚀 Enviar pedido
  const enviarPedido = async () => {
    if (!user || carrinho.length === 0) {
      setMensagem('Adicione produtos ao carrinho antes de enviar.');
      return;
    }

    try {
      await addDoc(collection(db, 'pedidos'), {
        clienteId: user.uid,
        clienteNome: user.displayName || 'Cliente',
        itens: carrinho.map(item => ({
          nome: item.nome,
          quantidade: item.quantidadeSelecionada,
          valorUnitario: item.valorVenda
        })),
        total: totalCarrinho,
        status: 'Pendente',
        criadoEm: Timestamp.now()
      });

      setMensagem('Pedido enviado com sucesso!');
      setCarrinho([]);
      localStorage.removeItem('carrinho');
      setQuantidades({});
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
      <div className="catalogo-header">
        <h1>Catálogo da Adega</h1>
        <button
          className="btn-meus-pedidos"
          onClick={() => setMostrarPedidos(!mostrarPedidos)}
        >
          {mostrarPedidos ? 'Voltar ao Catálogo' : 'Meus Pedidos'}
        </button>
      </div>

      {mensagem && <div className="mensagem">{mensagem}</div>}

      {!mostrarPedidos && (
        <>
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
            {produtosFiltrados.map(produto => {
              const quantidade = quantidades[produto.id] || 1;
              const disponivel = produto.quantidade > 0;
              return (
                <div key={produto.id} className="card-produto">
                  {produto.imagemURL ? <img src={produto.imagemURL} alt={produto.nome} /> : <div className="produto-sem-imagem">Sem Imagem</div>}
                  <h3>{produto.nome}</h3>
                  <p>R$ {produto.valorVenda.toFixed(2)}</p>
                  <p className="estoque">{disponivel ? `Disponível: ${produto.quantidade}` : 'Esgotado'}</p>

                  <input
                    type="number"
                    min={1}
                    max={produto.quantidade}
                    value={quantidade}
                    onChange={e => {
                      let val = parseInt(e.target.value) || 1;
                      if (val < 1) val = 1;
                      if (val > produto.quantidade) val = produto.quantidade;
                      setQuantidades(prev => ({ ...prev, [produto.id]: val }));
                    }}
                    disabled={!disponivel}
                  />

                  <button
                    onClick={() => adicionarCarrinho(produto, quantidade)}
                    disabled={!disponivel || quantidade < 1 || quantidade > produto.quantidade}
                  >
                    {disponivel ? 'Adicionar ao Carrinho' : 'Esgotado'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Carrinho lateral */}
          <div className="carrinho-lateral">
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

            <button className="enviar-pedido" onClick={enviarPedido}>Finalizar Pedido</button>
          </div>
        </>
      )}

      {/* Aba Meus Pedidos */}
      {mostrarPedidos && (
        <div className="meus-pedidos">
          <h2>📦 Meus Pedidos</h2>
          {pedidosCliente.length === 0 ? (
            <p>Você ainda não fez pedidos.</p>
          ) : (
            <ul>
              {pedidosCliente.map(p => (
                <li key={p.id}>
                  <strong>Status:</strong> {p.status.toUpperCase()}<br />
                  <strong>Total:</strong> R$ {p.total.toFixed(2)}<br />
                  <small>Feito em: {p.criadoEm?.toDate ? p.criadoEm.toDate().toLocaleString('pt-BR') : ''}</small>
                  <br />
                  <strong>Itens:</strong>
                  <ul>
                    {p.itens.map((i, idx) => (
                      <li key={idx}>
                        {i.nome} x{i.quantidade} - R$ {(i.valorUnitario * i.quantidade).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
