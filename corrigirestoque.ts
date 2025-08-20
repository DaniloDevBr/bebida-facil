// corrigirEstoque.ts
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./src/services/firebase";


async function corrigirEstoque() {
  try {
    console.log("🔄 Iniciando correção de estoque...");

    const produtosRef = collection(db, "produtos");
    const snapshot = await getDocs(produtosRef);

    if (snapshot.empty) {
      console.log("⚠️ Nenhum produto encontrado.");
      return;
    }

    let corrigidos = 0;

    for (const produto of snapshot.docs) {
      const dados = produto.data();
      const estoqueAtual = dados.estoque;

      if (estoqueAtual === undefined || estoqueAtual === null || isNaN(estoqueAtual)) {
        const refProduto = doc(db, "produtos", produto.id);

        await updateDoc(refProduto, {
          estoque: 0,
        });

        corrigidos++;
        console.log(`✅ Estoque corrigido para 0 no produto: ${produto.id}`);
      }
    }

    console.log(`🎉 Correção concluída! Produtos corrigidos: ${corrigidos}`);
  } catch (error) {
    console.error("❌ Erro ao corrigir estoques:", error);
  }
}

// Executa a função
corrigirEstoque();
