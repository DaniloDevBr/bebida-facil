// src/pages/CatalogoPublico.tsx
import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, Timestamp, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/catalogoPublico.css";

interface Produto {
  id: string;
  nome: string;
  valorCompra: number;
  valorVenda: number;
  unidade: string;
  categoria: string;
  quantidade: number;
  imagemBase64?: string; // ✅ base64 da imagem
}

interface ItemCarrinho extends Produto {
  quantidade: number;
}

const CatalogoPublico: React.FC = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [clienteNome, setClienteNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [pagamento, setPagamento] = useState("Dinheiro");
  const [mensagem, setMensagem] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todas");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [quantidades, setQuantidades] = useState<{ [key: string]: number }>({});

  // Carrega produtos em tempo real
  useEffect(() => {
    const produtosRef = collection(db, "produtos");
    const unsubscribe = onSnapshot(produtosRef, snapshot => {
      const lista: Produto[] = [];
      const categoriasSet = new Set<string>();

      snapshot.forEach(doc => {
        const data = doc.data();
        const quantidadeNum = Number(data.quantidade) || 0;

        lista.push({
          id: doc.id,
          nome: data.nome || "Sem Nome",
          valorCompra: Number(data.valorCompra) || 0,
          valorVenda: Number(data.valorVenda) || 0,
          unidade: data.unidade || "un",
          categoria: data.categoria || "Sem Categoria",
          quantidade: quantidadeNum,
          imagemBase64: data.imagemBase64 || "", // ✅ base64 da imagem
        });

        categoriasSet.add(data.categoria || "Sem Categoria");
      });

      setProdutos(lista);
      setCategorias(["Todas", ...Array.from(categoriasSet)]);

      // Ajusta quantidade no carrinho se estoque mudou
      setCarrinho(prev => prev.map(item => {
        const prodAtual = lista.find(p => p.id === item.id);
        if (!prodAtual) return item;
        const novaQuantidade = Math.min(item.quantidade, prodAtual.quantidade);
        return { ...item, quantidade: novaQuantidade };
      }));
    });

    // Carrega carrinho do localStorage
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

  const enviarPedido = async () => {
    if (!clienteNome || !telefone || carrinho.length === 0) {
      setMensagem("Preencha seu nome, telefone e adicione produtos ao carrinho.");
      return;
    }

    const texto = `🛒 Novo pedido:\n\nCliente: ${clienteNome}\nTelefone: ${telefone}\nEndereço: ${endereco}\nPagamento: ${pagamento}\n\nProdutos:\n${carrinho
      .map(i => `${i.nome} x ${i.quantidade} (R$ ${(i.valorVenda * i.quantidade).toFixed(2)})`)
      .join("\n")}\n\nTotal: R$ ${totalCarrinho.toFixed(2)}`;

    try {
      await addDoc(collection(db, "pedidos"), {
        clienteNome,
        telefone,
        endereco,
        pagamento,
        produtos: carrinho.map(item => ({
          produtoId: item.id,
          nome: item.nome,
          quantidade: item.quantidade,
          valorUnitario: item.valorVenda,
        })),
        total: totalCarrinho,
        status: "novo",
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
      window.open(
        `https://api.whatsapp.com/send?phone=${telefoneAdmin}&text=${encodeURIComponent(texto)}`,
        "_blank"
      );

      setCarrinho([]);
      localStorage.removeItem("carrinho");
      setMensagem("Pedido enviado com sucesso!");
      setQuantidades({});
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao enviar pedido. Tente novamente.");
    }
  };

  const produtosFiltrados = categoriaSelecionada === "Todas"
    ? produtos
    : produtos.filter(p => p.categoria === categoriaSelecionada);

  return (
    <div className="catalogo-publico-container">
      <div className="catalogo-header">
        <h1>Catálogo Público</h1>
        <button className="btn-voltar" onClick={() => navigate("/login")}>
          Voltar
        </button>
      </div>

      {mensagem && <div className="mensagem">{mensagem}</div>}

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
        <div className="produtos-grid">
          {produtosFiltrados.map(produto => {
            const quantidade = quantidades[produto.id] || 1;
            const disponivel = produto.quantidade > 0;

            return (
              <div key={produto.id} className="card-produto">
                {/* ✅ Exibição da imagem Base64 */}
                {produto.imagemBase64 ? (
                  <img src={produto.imagemBase64} alt={produto.nome} className="produto-imagem" />
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
                  onChange={(e) => {
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
            <input type="tel" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
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
    </div>
  );
};

export default CatalogoPublico;
