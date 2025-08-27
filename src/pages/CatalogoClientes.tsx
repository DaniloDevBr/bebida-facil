// src/pages/CatalogoClientes.tsx
import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/catalogoClientes.css";
import { useAuth } from "../services/AuthContext";

interface Produto {
  id: string;
  nome: string;
  valorCompra: number;
  valorVenda: number;
  unidade: string;
  categoria: string;
  quantidade: number;
  imagemURL?: string;
  imagemBase64?: string;
}

interface ItemCarrinho extends Produto {
  quantidade: number;
}

interface Pedido {
  id: string;
  clienteNome: string;
  telefone: string;
  endereco: string;
  pagamento: string;
  itens: { nome: string; quantidade: number; valorUnitario: number; valorCusto: number }[];
  total: number;
  status: string;
  criadoEm: any;
  clienteId: string;
}

const CatalogoClientes: React.FC = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [clienteNome, setClienteNome] = useState(localStorage.getItem("clienteNome") || "");
  const [telefone, setTelefone] = useState(localStorage.getItem("telefone") || "");
  const [endereco, setEndereco] = useState(localStorage.getItem("endereco") || "");
  const [pagamento, setPagamento] = useState(localStorage.getItem("pagamento") || "Dinheiro");
  const [mensagem, setMensagem] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todas");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [quantidades, setQuantidades] = useState<{ [key: string]: number }>({});
  const [pedidosCliente, setPedidosCliente] = useState<Pedido[]>([]);
  const [mostrarPedidos, setMostrarPedidos] = useState(false);

  // 🔄 Carrega produtos em tempo real
  useEffect(() => {
    const produtosRef = collection(db, "produtos");
    const unsubscribe = onSnapshot(produtosRef, snapshot => {
      const lista: Produto[] = [];
      const categoriasSet = new Set<string>();

      snapshot.forEach(doc => {
        const data = doc.data();
        const estoqueNum = Number(data.quantidade) || 0;

        lista.push({
          id: doc.id,
          nome: data.nome || "Sem Nome",
          valorCompra: Number(data.valorCompra) || 0,
          valorVenda: Number(data.valorVenda) || 0,
          unidade: data.unidade || "un",
          categoria: data.categoria || "Sem Categoria",
          quantidade: estoqueNum,
          imagemURL: data.imagemURL || "",
          imagemBase64: data.imagemBase64 || "",
        });

        categoriasSet.add(data.categoria || "Sem Categoria");
      });

      setProdutos(lista);
      setCategorias(["Todas", ...Array.from(categoriasSet)]);

      setCarrinho(prev =>
        prev.map(item => {
          const prodAtual = lista.find(p => p.id === item.id);
          if (!prodAtual) return item;
          const novaQuantidade = Math.min(item.quantidade, prodAtual.quantidade);
          return { ...item, quantidade: novaQuantidade };
        })
      );
    });

    const savedCart = localStorage.getItem("carrinho");
    if (savedCart) {
      const parsedCart: ItemCarrinho[] = JSON.parse(savedCart);
      setCarrinho(parsedCart);

      const initialQuantities: { [key: string]: number } = {};
      parsedCart.forEach(item => {
        initialQuantities[item.id] = item.quantidade;
      });
      setQuantidades(initialQuantities);
    }

    return () => unsubscribe();
  }, []);

  // 🔎 Escuta pedidos do cliente logado em tempo real
  useEffect(() => {
    if (!currentUser) return;

    const pedidosRef = collection(db, "pedidos");
    const q = query(
      pedidosRef,
      where("clienteId", "==", currentUser.uid),
      orderBy("criadoEm", "desc")
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const lista: Pedido[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as Omit<Pedido, "id">;
        return {
          id: docSnap.id,
          ...data,
          itens: data.itens?.map((i: any) => ({
            nome: i.nome,
            quantidade: i.quantidade,
            valorUnitario: i.valorUnitario ?? i.preco,
            valorCusto: i.valorCusto ?? 0,
          })) || [],
        };
      });
      setPedidosCliente(lista);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ➕ Adicionar ao carrinho
  const adicionarCarrinho = async (produto: Produto, quantidade: number) => {
    const prodAtual = produtos.find(p => p.id === produto.id);
    if (!prodAtual) return alert("Produto não encontrado.");

    const estoqueAtual = prodAtual.quantidade;
    if (quantidade <= 0 || quantidade > estoqueAtual) {
      alert(`Quantidade inválida! Máximo disponível: ${estoqueAtual}`);
      return;
    }

    const existe = carrinho.find(item => item.id === produto.id);
    let novoCarrinho: ItemCarrinho[];

    if (existe) {
      const totalQuantidade = existe.quantidade + quantidade;
      if (totalQuantidade > estoqueAtual) {
        alert(`Estoque insuficiente! Máximo disponível: ${estoqueAtual}`);
        return;
      }
      novoCarrinho = carrinho.map(item =>
        item.id === produto.id ? { ...item, quantidade: totalQuantidade } : item
      );
    } else {
      novoCarrinho = [...carrinho, { ...produto, quantidade }];
    }

    setCarrinho(novoCarrinho);
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
    setQuantidades(prev => ({ ...prev, [produto.id]: 1 }));

    try {
      const produtoRef = doc(db, "produtos", produto.id);
      await updateDoc(produtoRef, { quantidade: estoqueAtual - quantidade });
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
    }
  };

  // ❌ Remover item do carrinho
  const removerItem = async (produtoId: string) => {
    const item = carrinho.find(i => i.id === produtoId);
    if (!item) return;

    const novoCarrinho = carrinho.filter(i => i.id !== produtoId);
    setCarrinho(novoCarrinho);
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));

    try {
      const produtoRef = doc(db, "produtos", produtoId);
      const prodAtual = produtos.find(p => p.id === produtoId);
      const estoqueAtual = prodAtual ? prodAtual.quantidade : 0;
      await updateDoc(produtoRef, { quantidade: estoqueAtual + item.quantidade });
    } catch (error) {
      console.error("Erro ao restaurar estoque:", error);
    }
  };

  const totalCarrinho = carrinho.reduce(
    (acc, item) => acc + item.valorVenda * item.quantidade,
    0
  );

  // 🚀 Enviar pedido
  const enviarPedido = async () => {
    if (!clienteNome.trim() || !telefone.trim() || !endereco.trim() || carrinho.length === 0 || !currentUser) {
      setMensagem("Preencha todos os dados e adicione produtos ao carrinho.");
      return;
    }

    const telLimpo = telefone.replace(/\D/g, "");
    if (telLimpo.length < 10) {
      setMensagem("Informe um telefone válido com DDD.");
      return;
    }

    try {
      await addDoc(collection(db, "pedidos"), {
        clienteId: currentUser.uid,
        clienteNome,
        telefone,
        endereco,
        pagamento,
        itens: carrinho.map(item => ({
          nome: item.nome,
          quantidade: item.quantidade,
          valorUnitario: item.valorVenda,
          valorCusto: item.valorCompra,
        })),
        total: totalCarrinho,
        status: "Pendente",
        criadoEm: Timestamp.now(),
      });

      for (const item of carrinho) {
        const produtoOriginal = produtos.find(p => p.id === item.id);
        const valorCompra = Number(produtoOriginal?.valorCompra || 0);
        const valorVenda = Number(item.valorVenda);

        await addDoc(collection(db, "vendas"), {
          produtoId: item.id,
          nome: item.nome,
          quantidade: Number(item.quantidade),
          unidade: item.unidade,
          valorCompra,
          valorVenda,
          data: Timestamp.now(),
        });
      }

      const telefoneAdmin = "5512982853312";
      const resumoProdutos = carrinho
        .map(i => `- ${i.nome} x${i.quantidade} = R$ ${(i.valorVenda * i.quantidade).toFixed(2)}`)
        .join("\n");
      const texto = `🛒 *Novo pedido* 🛒\n\n👤 Cliente: ${clienteNome}\n📞 Telefone: ${telefone}\n🏠 Endereço: ${endereco}\n💳 Pagamento: ${pagamento}\n\n📦 *Itens do pedido:*\n${resumoProdutos}\n\n💰 Total: R$ ${totalCarrinho.toFixed(2)}`;
      window.open(
        `https://api.whatsapp.com/send?phone=${telefoneAdmin}&text=${encodeURIComponent(texto)}`,
        "_blank"
      );

      setCarrinho([]);
      localStorage.removeItem("carrinho");
      setMensagem("Pedido enviado com sucesso!");
      setQuantidades({});
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      setMensagem("Erro ao enviar pedido. Tente novamente.");
    }
  };

  // 🔹 Salvar dados do cliente no localStorage
  useEffect(() => { localStorage.setItem("clienteNome", clienteNome); }, [clienteNome]);
  useEffect(() => { localStorage.setItem("telefone", telefone); }, [telefone]);
  useEffect(() => { localStorage.setItem("endereco", endereco); }, [endereco]);
  useEffect(() => { localStorage.setItem("pagamento", pagamento); }, [pagamento]);

  const produtosFiltrados = categoriaSelecionada === "Todas"
    ? produtos
    : produtos.filter(p => p.categoria === categoriaSelecionada);

  return (
    <div className="catalogo-container">
      <div className="catalogo-header">
        <h1>Catálogo de Produtos</h1>
        <button
          className="btn-voltar"
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          Voltar
        </button>
        <button
          className="btn-meus-pedidos"
          onClick={() => setMostrarPedidos(!mostrarPedidos)}
        >
          {mostrarPedidos ? "Voltar ao Catálogo" : "Meus Pedidos"}
        </button>
      </div>

      {mensagem && <div className="mensagem">{mensagem}</div>}

      {!mostrarPedidos ? (
        <>
          {/* Menu de categorias */}
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

          <div className="catalogo-content">
            {/* Produtos */}
            <div className="produtos-grid">
              {produtosFiltrados.map(produto => {
                const quantidade = quantidades[produto.id] || 1;
                const disponivel = produto.quantidade > 0;

                return (
                  <div key={produto.id} className="card-produto">
                    {produto.imagemBase64 ? (
                      <img src={produto.imagemBase64} alt={produto.nome} className="produto-imagem" />
                    ) : produto.imagemURL ? (
                      <img src={produto.imagemURL} alt={produto.nome} className="produto-imagem" />
                    ) : (
                      <div className="produto-sem-imagem">Sem Imagem</div>
                    )}

                    <h3>{produto.nome}</h3>
                    <p>R$ {produto.valorVenda.toFixed(2)}</p>
                    <p className="estoque">{disponivel ? `Disponível: ${produto.quantidade}` : "Esgotado"}</p>

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
                      {disponivel ? "Adicionar ao Carrinho" : "Esgotado"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Carrinho */}
            <div className="carrinho-lateral">
              <h2>Carrinho</h2>
              {carrinho.length === 0 ? (
                <p>O carrinho está vazio.</p>
              ) : (
                <ul>
                  {carrinho.map(item => (
                    <li key={item.id}>
                      {item.nome} x {item.quantidade} - R$ {(item.valorVenda * item.quantidade).toFixed(2)}
                      <button className="remover" onClick={() => removerItem(item.id)}>Excluir</button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="total">Total: R$ {totalCarrinho.toFixed(2)}</p>

              <div className="checkout">
                <input type="text" placeholder="Seu nome" value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
                <input type="tel" placeholder="Telefone (com DDD)" value={telefone} onChange={e => setTelefone(e.target.value)} />
                <input type="text" placeholder="Endereço de entrega" value={endereco} onChange={e => setEndereco(e.target.value)} />

                <select value={pagamento} onChange={e => setPagamento(e.target.value)}>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Pix">Pix</option>
                  <option value="Cartão">Cartão</option>
                </select>

                <button className="enviar-pedido" onClick={enviarPedido}>Finalizar Pedido</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Aba de acompanhamento de pedidos
        <div className="meus-pedidos">
          <h2>📦 Meus Pedidos</h2>
          {pedidosCliente.length === 0 ? (
            <p>Você ainda não fez pedidos.</p>
          ) : (
            <div className="lista-pedidos">
              {pedidosCliente.map(p => (
                <div key={p.id} className="pedido-card">
                  <div className="pedido-header">
                    <span>
                      <strong>Status:</strong>{" "}
                      <span className={`status ${p.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {p.status}
                      </span>
                    </span>
                    <span><strong>Total:</strong> R$ {p.total.toFixed(2)}</span>
                  </div>
                  <div className="pedido-data">
                    <small>Feito em: {p.criadoEm?.toDate ? p.criadoEm.toDate().toLocaleString("pt-BR") : ""}</small>
                  </div>
                  <div className="pedido-itens">
                    <strong>Itens do pedido:</strong>
                    <ul>
                      {p.itens.map((i, idx) => (
                        <li key={idx}>{i.nome} x{i.quantidade} - R$ {(i.valorUnitario * i.quantidade).toFixed(2)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CatalogoClientes;
