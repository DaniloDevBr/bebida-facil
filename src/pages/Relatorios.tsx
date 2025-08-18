import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchVendas();
  }, []);

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
      [header, ...rows]
        .map(e => e.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');

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
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-4 text-indigo-700">Relatórios de Vendas</h2>

      {/* Botão de voltar ao menu inicial */}
      <button
        onClick={() => navigate('/')}
        className="mb-6 px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold transition"
      >
        ← Voltar ao Menu Inicial
      </button>

      {/* Seção de filtro por datas */}
      <section className="mb-8">
        <h3 className="font-semibold text-lg mb-3">Filtrar por data</h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <label className="flex flex-col text-gray-700">
            Início:
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="border rounded-md p-2 mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col text-gray-700">
            Fim:
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="border rounded-md p-2 mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </label>
          <button
            onClick={fetchVendas}
            disabled={loading}
            className={`px-5 py-2 rounded-md font-semibold text-white transition ${
              loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Carregando...' : 'Filtrar'}
          </button>
          <button
            onClick={exportarCSV}
            disabled={loading || vendas.length === 0}
            className={`px-5 py-2 rounded-md font-semibold text-white transition ${
              loading || vendas.length === 0
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            Exportar CSV
          </button>
        </div>
      </section>

      {/* Totais gerais */}
      <section className="mb-8 bg-indigo-50 rounded-md p-4 shadow-inner">
        <h3 className="font-semibold text-lg mb-3">Totais Gerais</h3>
        <p className="text-gray-700">
          Quantidade total vendida: <strong>{totalQuantidade}</strong>
        </p>
        <p className="text-gray-700">
          Receita total estimada: <strong>R$ {totalReceita.toFixed(2)}</strong>
        </p>
      </section>

      {/* Vendas por produto */}
      <section className="mb-8">
        <h3 className="font-semibold text-lg mb-5 text-indigo-700">Vendas por Produto</h3>
        {resumoPorProduto.length === 0 ? (
          <p className="text-gray-600">Nenhuma venda encontrada no período.</p>
        ) : (
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer>
              <BarChart
                data={resumoPorProduto}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => value.toFixed(2)} />
                <Legend />
                <Bar dataKey="quantidadeTotal" fill="#6366f1" name="Quantidade" />
                <Bar dataKey="receitaTotal" fill="#34d399" name="Receita (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Lista de vendas */}
      <section>
        <h3 className="font-semibold text-lg mb-4 text-indigo-700">Lista de Vendas</h3>
        {loading ? (
          <p className="text-gray-600">Carregando vendas...</p>
        ) : vendas.length === 0 ? (
          <p className="text-gray-600">Nenhuma venda encontrada no período.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Produto
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Quantidade
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Unidade
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Preço Unitário (R$)
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((venda) => (
                  <tr
                    key={venda.id}
                    className="border-b border-gray-200 hover:bg-indigo-50 transition"
                  >
                    <td className="border border-gray-300 px-4 py-2 text-sm">{venda.nome}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{venda.quantidade}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{venda.unidade}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {venda.valorVenda ? venda.valorVenda.toFixed(2) : '—'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {venda.data.toDate().toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Relatorios;
