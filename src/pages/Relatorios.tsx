import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/relatorios.css';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, Timestamp, Query, DocumentData } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Venda {
  id: string;
  produtoId: string;
  nome: string;
  quantidade: number | string;
  unidade: string;
  data?: Timestamp | Date | null; 
  valorVenda?: number | string;
  valorCompra?: number | string;
}

interface ProdutoVendaResumo {
  nome: string;
  quantidadeTotal: number;
  receitaTotal: number;
  lucroTotal: number;
}

const Relatorios = () => {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [totalQuantidade, setTotalQuantidade] = useState(0);
  const [totalReceita, setTotalReceita] = useState(0);
  const [totalLucro, setTotalLucro] = useState(0);
  const [resumoPorProduto, setResumoPorProduto] = useState<ProdutoVendaResumo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVendas = async () => {
    setLoading(true);
    try {
      const constraints = [];
      if (dataInicio) constraints.push(where('data', '>=', Timestamp.fromDate(new Date(dataInicio))));
      if (dataFim) constraints.push(where('data', '<=', Timestamp.fromDate(new Date(dataFim))));

      let q: Query<DocumentData> = collection(db, 'vendas');
      if (constraints.length > 0) q = query(collection(db, 'vendas'), ...constraints);

      const querySnapshot = await getDocs(q);
      const vendasLista: Venda[] = [];
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        vendasLista.push({
          ...(data as Venda),
          id: docSnap.id,
          data: data.data ?? null,
        });
      });

      setVendas(vendasLista);
      processaResumo(vendasLista);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      setVendas([]);
      setTotalQuantidade(0);
      setTotalReceita(0);
      setTotalLucro(0);
      setResumoPorProduto([]);
    }
    setLoading(false);
  };

  const processaResumo = (vendasLista: Venda[]) => {
    let qtdTotal = 0;
    let receitaTotal = 0;
    let lucroTotal = 0;
    const resumoMap = new Map<string, ProdutoVendaResumo>();

    vendasLista.forEach(venda => {
      const quantidade = Number(venda.quantidade) || 0;
      const precoVenda = Number(venda.valorVenda) || 0;
      const precoCompra = Number(venda.valorCompra) || 0;

      qtdTotal += quantidade;
      receitaTotal += precoVenda * quantidade;
      lucroTotal += (precoVenda - precoCompra) * quantidade;

      if (!resumoMap.has(venda.nome)) {
        resumoMap.set(venda.nome, { nome: venda.nome, quantidadeTotal: 0, receitaTotal: 0, lucroTotal: 0 });
      }

      const item = resumoMap.get(venda.nome)!;
      item.quantidadeTotal += quantidade;
      item.receitaTotal += precoVenda * quantidade;
      item.lucroTotal += (precoVenda - precoCompra) * quantidade;
    });

    setTotalQuantidade(qtdTotal);
    setTotalReceita(receitaTotal);
    setTotalLucro(lucroTotal);
    setResumoPorProduto(Array.from(resumoMap.values()));
  };

  const formatarData = (data: any) => {
    if (!data) return '—';
    try {
      if (data instanceof Timestamp) return data.toDate().toLocaleString();
      if (data instanceof Date) return data.toLocaleString();
      return new Date(data).toLocaleString();
    } catch {
      return '—';
    }
  };

  const exportarCSV = () => {
    if (vendas.length === 0) return alert('Não há dados para exportar.');
    const header = ['Produto', 'Quantidade', 'Unidade', 'Preço Venda', 'Preço Compra', 'Data'];
    const rows = vendas.map(v => [
      v.nome,
      String(v.quantidade ?? 0),
      v.unidade,
      v.valorVenda ? Number(v.valorVenda).toFixed(2) : '0.00',
      v.valorCompra ? Number(v.valorCompra).toFixed(2) : '0.00',
      formatarData(v.data),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [header, ...rows]
        .map(e => e.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `relatorio_vendas_${dataInicio || 'inicio'}_a_${dataFim || 'fim'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchVendas();
  }, []);

  return (
    <div className="relatorios-container">
      {/* Botão de voltar ao menu */}
      <button onClick={() => navigate('/')} className="back-btn">
        ← Voltar ao Menu Inicial
      </button>

      <h2>Relatórios de Vendas</h2>

      {/* Filtro por datas */}
      <div className="filtro-datas">
        <label>
          Início:
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </label>
        <label>
          Fim:
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </label>
        <button onClick={fetchVendas} disabled={loading}>{loading ? 'Carregando...' : 'Filtrar'}</button>
        <button onClick={exportarCSV} disabled={loading || vendas.length === 0}>Exportar CSV</button>
      </div>

      {/* Totais gerais */}
      <div className="totais-gerais">
        <p>Quantidade total vendida: <strong>{totalQuantidade}</strong></p>
        <p>Receita total: <strong>R$ {totalReceita.toFixed(2)}</strong></p>
        <p style={{ color: totalLucro >= 0 ? 'green' : 'red' }}>
          Lucro total: <strong>R$ {totalLucro.toFixed(2)}</strong>
        </p>
      </div>

      {/* Gráfico */}
      {resumoPorProduto.length > 0 && (
        <div className="grafico">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resumoPorProduto} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => value.toFixed(2)} />
              <Legend />
              <Bar dataKey="quantidadeTotal" fill="#6366f1" name="Quantidade" />
              <Bar dataKey="receitaTotal" fill="#34d399" name="Receita (R$)" />
              <Bar dataKey="lucroTotal" fill="#f59e0b" name="Lucro (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lista de vendas */}
      <div className="lista-vendas">
        {vendas.length === 0 ? <p>Nenhuma venda encontrada.</p> : (
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Unidade</th>
                <th>Preço Venda (R$)</th>
                <th>Preço Compra (R$)</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map(venda => (
                <tr key={venda.id}>
                  <td>{venda.nome}</td>
                  <td>{Number(venda.quantidade) || 0}</td>
                  <td>{venda.unidade}</td>
                  <td>{venda.valorVenda ? Number(venda.valorVenda).toFixed(2) : '0.00'}</td>
                  <td>{venda.valorCompra ? Number(venda.valorCompra).toFixed(2) : '0.00'}</td>
                  <td>{formatarData(venda.data)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Relatorios;
