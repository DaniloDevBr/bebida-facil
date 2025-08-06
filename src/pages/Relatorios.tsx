import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, Timestamp, Query } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Venda {
  id: string;
  produtoId: string;
  nome: string;
  quantidade: number;
  unidade: string;
  data: Timestamp;
  valorVenda?: number; // preço unitário de venda
}

interface ProdutoVendaResumo {
  nome: string;
  quantidadeTotal: number;
  receitaTotal: number;
}

const Relatorios = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [totalQuantidade, setTotalQuantidade] = useState(0);
  const [totalReceita, setTotalReceita] = useState(0);
  const [resumoPorProduto, setResumoPorProduto] = useState<ProdutoVendaResumo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVendas = async () => {
    setLoading(true);
    try {
      const constraints = [];
      if (dataInicio) {
        const inicio = Timestamp.fromDate(new Date(dataInicio));
        constraints.push(where('data', '>=', inicio));
      }
      if (dataFim) {
        const fim = Timestamp.fromDate(new Date(dataFim));
        constraints.push(where('data', '<=', fim));
      }

      let q: Query = collection(db, 'vendas');
      if (constraints.length > 0) {
        q = query(collection(db, 'vendas'), ...constraints);
      }

      const querySnapshot = await getDocs(q);
      const vendasLista: Venda[] = [];
      querySnapshot.forEach(docSnap => {
        // Aqui espalhe primeiro os dados, depois sobrescreva o id
        vendasLista.push({ ...(docSnap.data() as Venda), id: docSnap.id });
      });
      setVendas(vendasLista);
      processaResumo(vendasLista);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      setVendas([]);
      setTotalQuantidade(0);
      setTotalReceita(0);
      setResumoPorProduto([]);
    }
    setLoading(false);
  };

  const processaResumo = (vendasLista: Venda[]) => {
    let qtdTotal = 0;
    let receitaTotal = 0;
    const resumoMap = new Map<string, ProdutoVendaResumo>();

    vendasLista.forEach(venda => {
      qtdTotal += venda.quantidade;
      const preco = venda.valorVenda ?? 0;
      receitaTotal += preco * venda.quantidade;

      if (!resumoMap.has(venda.nome)) {
        resumoMap.set(venda.nome, {
          nome: venda.nome,
          quantidadeTotal: 0,
          receitaTotal: 0,
        });
      }
      const item = resumoMap.get(venda.nome)!;
      item.quantidadeTotal += venda.quantidade;
      item.receitaTotal += preco * venda.quantidade;
    });

    setTotalQuantidade(qtdTotal);
    setTotalReceita(receitaTotal);
    setResumoPorProduto(Array.from(resumoMap.values()));
  };

  React.useEffect(() => {
    fetchVendas();
  }, []);

  // Função para exportar CSV
  const exportarCSV = () => {
    if (vendas.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }
    const header = ['Produto', 'Quantidade', 'Unidade', 'Preço Unitário', 'Data'];
    const rows = vendas.map(v => [
      v.nome,
      v.quantidade.toString(),
      v.unidade,
      v.valorVenda ? v.valorVenda.toFixed(2) : '',
      v.data.toDate().toLocaleString(),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [header, ...rows].map(e => e.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    const dataIni = dataInicio ? dataInicio : 'inicio';
    const dataFi = dataFim ? dataFim : 'fim';
    link.download = `relatorio_vendas_${dataIni}_a_${dataFi}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Relatórios de Vendas</h2>

      <section className="mb-6">
        <h3 className="font-semibold mb-2">Filtrar por data</h3>
        <div className="flex gap-4">
          <label>
            Início:{' '}
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="border p-1 rounded"
            />
          </label>
          <label>
            Fim:{' '}
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="border p-1 rounded"
            />
          </label>
          <button
            onClick={fetchVendas}
            className="bg-blue-600 text-white px-4 py-1 rounded"
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Filtrar'}
          </button>
          <button
            onClick={exportarCSV}
            className="bg-green-600 text-white px-4 py-1 rounded"
            disabled={loading || vendas.length === 0}
          >
            Exportar CSV
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-semibold mb-2">Totais Gerais</h3>
        <p>
          Quantidade total vendida: <strong>{totalQuantidade}</strong>
        </p>
        <p>
          Receita total estimada: <strong>R$ {totalReceita.toFixed(2)}</strong>
        </p>
      </section>

      <section className="mb-6">
        <h3 className="font-semibold mb-4">Vendas por Produto</h3>
        {resumoPorProduto.length === 0 ? (
          <p>Nenhuma venda encontrada no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resumoPorProduto} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip formatter={(value: number) => value.toFixed(2)} />
              <Legend />
              <Bar dataKey="quantidadeTotal" fill="#8884d8" name="Quantidade" />
              <Bar dataKey="receitaTotal" fill="#82ca9d" name="Receita (R$)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section>
        <h3 className="font-semibold mb-4">Lista de Vendas</h3>
        {loading ? (
          <p>Carregando vendas...</p>
        ) : vendas.length === 0 ? (
          <p>Nenhuma venda encontrada no período.</p>
        ) : (
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-left">Produto</th>
                <th className="border px-2 py-1 text-left">Quantidade</th>
                <th className="border px-2 py-1 text-left">Unidade</th>
                <th className="border px-2 py-1 text-left">Preço Unitário (R$)</th>
                <th className="border px-2 py-1 text-left">Data</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((venda) => (
                <tr key={venda.id} className="border-b">
                  <td className="border px-2 py-1">{venda.nome}</td>
                  <td className="border px-2 py-1">{venda.quantidade}</td>
                  <td className="border px-2 py-1">{venda.unidade}</td>
                  <td className="border px-2 py-1">
                    {venda.valorVenda ? venda.valorVenda.toFixed(2) : '—'}
                  </td>
                  <td className="border px-2 py-1">{venda.data.toDate().toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default Relatorios;
