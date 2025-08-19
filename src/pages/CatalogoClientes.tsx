import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import "../styles/catalogoClientes.css";

interface Produto {
  id: string;
  nome: string;
  valorVenda: number;
  unidade: string;
  imagemURL?: string;
}

interface ItemCarrinho extends Produto {
  quantidade: number;
}

const CatalogoClientes: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [clienteNome, setClienteNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    fetchProdutos();
    const savedCart = localStorage.getItem("carrinho");
    if (savedCart) setCarrinho(JSON.parse(savedCart));
  }, []);

  const fetchProdutos = async () => {
    try {
      const snapshot = await getDocs(collection(db, "produtos"));
      const lista: Produto[] = [];
      snapshot.forEach(doc => {
        lista.push({ id: doc.id, ...(doc.data() as Omit<Produto, "id">) });
      });
      setProdutos(lista);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const adicionarCarrinho = (produto: Produto) => {
    const existe = carrinho.find(item => item.id === produto.id);
    let novoCarrinho: ItemCarrinho[];
    if (existe) {
      novoCarrinho = carrinho.map(item =>
        item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
      );
    } else {
      novoCarrinho = [...carrinho, { ...produto, quantidade: 1 }];
    }
    setCarrinho(novoCarrinho);
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
  };

  const removerItem = (produtoId: string) => {
    const novoCarrinho = carrinho.filter(item => item.id !== produtoId);
    setCarrinho(novoCarrinho);
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
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

    try {
      // Salvar pedido no Firestore
      await addDoc(collection(db, "pedidos"), {
        clienteNome,
        telefone,
        endereco,
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

      // Limpar carrinho
      setCarrinho([]);
      localStorage.removeItem("carrinho");
      setClienteNome("");
      setTelefone("");
      setEndereco("");
      setMensagem("Pedido enviado com sucesso!");

      // Enviar para WhatsApp
      const texto = `Olá, gostaria de fazer o pedido:\n${carrinho
        .map(i => `${i.nome} x ${i.quantidade}`)
        .join("\n")}\nTotal: R$ ${totalCarrinho.toFixed(2)}`;
      const telefoneAdmin = "5512988538036"; // Seu número
      window.open(
        `https://api.whatsapp.com/send?phone=${telefoneAdmin}&text=${encodeURIComponent(texto)}`,
        "_blank"
      );
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao enviar pedido. Tente novamente.");
    }
  };

  return (
    <div className="catalogo-container">
      <h1>Catálogo de Produtos</h1>
      {mensagem && <div className="mensagem">{mensagem}</div>}

      <div className="produtos-grid">
        {produtos.map(produto => (
          <div key={produto.id} className="card-produto">
            {produto.imagemURL && <img src={produto.imagemURL} alt={produto.nome} />}
            <h3>{produto.nome}</h3>
            <p>R$ {produto.valorVenda.toFixed(2)}</p>
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
                {item.nome} x {item.quantidade} - R$ {(item.valorVenda * item.quantidade).toFixed(2)}
                <button className="remover" onClick={() => removerItem(item.id)}>Excluir</button>
              </li>
            ))}
          </ul>
        )}
        <p className="total">Total: R$ {totalCarrinho.toFixed(2)}</p>

        <div className="checkout">
          <input
            type="text"
            placeholder="Seu nome"
            value={clienteNome}
            onChange={e => setClienteNome(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Telefone"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
          />
          <input
            type="text"
            placeholder="Endereço (opcional)"
            value={endereco}
            onChange={e => setEndereco(e.target.value)}
          />
          <button className="enviar-pedido" onClick={enviarPedido}>
            Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default CatalogoClientes;
