import React from 'react';
import {
  TrendingUp,
  FileText,
  DollarSign,
  PieChart,
  BarChart2,
  Users,
  Briefcase,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Inbox
} from 'lucide-react';
import { Cliente, Projeto, Recebimento } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

interface RelatoriosProps {
  clientes: Cliente[];
  projetos: Projeto[];
  recebimentos: Recebimento[];
}

export default function Relatorios({ clientes, projetos, recebimentos }: RelatoriosProps) {

  // Context years/months
  const currentYearStr = '2026';
  const currentMonthStr = '06'; // June

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // --- KPI CALCULATIONS ---
  const totalRecebido = recebimentos
    .filter(r => r.status === 'Recebido')
    .reduce((sum, r) => sum + r.valor, 0);

  const totalAReceber = recebimentos
    .filter(r => r.status === 'A Receber')
    .reduce((sum, r) => sum + r.valor, 0);

  const faturamentoMes = recebimentos
    .filter(r => r.status === 'Recebido' && r.dataRecebimento && r.dataRecebimento.startsWith(`${currentYearStr}-${currentMonthStr}`))
    .reduce((sum, r) => sum + r.valor, 0);

  const faturamentoAno = recebimentos
    .filter(r => r.status === 'Recebido' && r.dataRecebimento && r.dataRecebimento.startsWith(currentYearStr))
    .reduce((sum, r) => sum + r.valor, 0);

  // --- NOTAS FISCAIS STATS ---
  const nfEmitidas = recebimentos.filter(r => r.notaFiscal === 'Emitida').length;
  const nfPendentes = recebimentos.filter(r => r.notaFiscal === 'Pendente').length;
  const nfNaoNecessarias = recebimentos.filter(r => r.notaFiscal === 'Não Necessária').length;

  // --- EVOLUÇÃO DO FATURAMENTO (Month-by-month for 2026) ---
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const getEvolucaoMensal = () => {
    const data: { name: string; Faturado: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const monthStr = m + 1 < 10 ? `0${m + 1}` : `${m + 1}`;
      const yearMonthKey = `${currentYearStr}-${monthStr}`;

      const faturado = recebimentos
        .filter(r => r.status === 'Recebido' && r.dataRecebimento && r.dataRecebimento.startsWith(yearMonthKey))
        .reduce((sum, r) => sum + r.valor, 0);

      data.push({
        name: monthNames[m],
        Faturado: faturado
      });
    }
    return data;
  };

  const evolucaoData = getEvolucaoMensal();

  // --- CLIENTES QUE MAIS FATURARAM ---
  const getTopClientes = () => {
    const map: { [id: string]: { nome: string; total: number } } = {};
    clientes.forEach(c => {
      map[c.id] = { nome: c.nome, total: 0 };
    });

    recebimentos
      .filter(r => r.status === 'Recebido')
      .forEach(r => {
        if (map[r.clienteId]) {
          map[r.clienteId].total += r.valor;
        } else {
          map[r.clienteId] = { nome: r.clienteNome, total: r.valor };
        }
      });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  const topClientesData = getTopClientes();

  // --- PROJETOS MAIS LUCRATIVOS ---
  const getTopProjetos = () => {
    const map: { [id: string]: { nome: string; total: number; cliente: string } } = {};
    projetos.forEach(p => {
      map[p.id] = { nome: p.nome, total: 0, cliente: p.clienteNome };
    });

    recebimentos
      .filter(r => r.status === 'Recebido')
      .forEach(r => {
        if (map[r.projetoId]) {
          map[r.projetoId].total += r.valor;
        } else {
          map[r.projetoId] = { nome: r.projetoNome, total: r.valor, cliente: r.clienteNome };
        }
      });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  const topProjetosData = getTopProjetos();

  // --- RECEITA POR CATEGORIA ---
  const getReceitaCategoria = () => {
    const map: { [cat: string]: number } = {};
    recebimentos
      .filter(r => r.status === 'Recebido')
      .forEach(r => {
        map[r.categoria] = (map[r.categoria] || 0) + r.valor;
      });

    const total = Object.values(map).reduce((sum, v) => sum + v, 0) || 1;

    return Object.entries(map)
      .map(([cat, val]) => ({
        name: cat,
        value: val,
        percentage: (val / total) * 100
      }))
      .sort((a, b) => b.value - a.value);
  };

  const receitaCategoriaData = getReceitaCategoria();

  // --- RECEITA POR ORIGEM DO FATURAMENTO ---
  const getReceitaOrigem = () => {
    const map: { [origem: string]: number } = {};
    recebimentos
      .filter(r => r.status === 'Recebido')
      .forEach(r => {
        map[r.origem] = (map[r.origem] || 0) + r.valor;
      });

    const total = Object.values(map).reduce((sum, v) => sum + v, 0) || 1;

    return Object.entries(map)
      .map(([orig, val]) => ({
        name: orig,
        value: val,
        percentage: (val / total) * 100
      }))
      .sort((a, b) => b.value - a.value);
  };

  const receitaOrigemData = getReceitaOrigem();

  // Colors for chart items
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xs">
        <h2 className="text-lg font-black text-gray-950 dark:text-zinc-50 tracking-tight">Estatísticas & Relatórios</h2>
        <p className="text-xs text-gray-400 dark:text-zinc-500">Analise detalhadamente a saúde financeira do seu faturamento.</p>
      </div>

      {/* KPI Stats Panel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4.5 rounded-2xl flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold block">Total Recebido</span>
            <span className="text-base font-black text-gray-950 dark:text-zinc-50 mt-0.5">{formatCurrency(totalRecebido)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4.5 rounded-2xl flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold block">Valores a Receber</span>
            <span className="text-base font-black text-gray-950 dark:text-zinc-50 mt-0.5">{formatCurrency(totalAReceber)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4.5 rounded-2xl flex items-center gap-3.5">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/10 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold block">Faturado no Mês</span>
            <span className="text-base font-black text-gray-950 dark:text-zinc-50 mt-0.5">{formatCurrency(faturamentoMes)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4.5 rounded-2xl flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <ArrowUpRight size={18} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold block">Faturado no Ano</span>
            <span className="text-base font-black text-gray-950 dark:text-zinc-50 mt-0.5">{formatCurrency(faturamentoAno)}</span>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Evolution Chart (Evolução Mensal) */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100">Evolução Mensal</h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Histórico de faturamento acumulado por mês</p>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md font-bold">2026</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucaoData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFaturadoRel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000) + 'k' : v}`} tick={{ fontSize: 11, fill: '#888888' }} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Faturado']} />
                <Area type="monotone" dataKey="Faturado" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFaturadoRel)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clientes que mais faturaram */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100">Clientes que mais Faturaram</h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Rank de maiores fontes de receita</p>
          </div>

          <div className="h-64 w-full mt-4">
            {topClientesData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-24">Nenhum faturamento registrado.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClientesData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="nome" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#888888' }} width={120} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Faturado']} />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={16}>
                    {topClientesData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Projetos mais lucrativos */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100">Projetos mais Lucrativos</h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Maiores faturamentos consolidados</p>
          </div>

          <div className="h-64 w-full mt-4">
            {topProjetosData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-24">Nenhum faturamento registrado.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProjetosData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="nome" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#888888' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#888888' }} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Faturado']} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={20}>
                    {topProjetosData.map((entry, idx) => (
                      <Cell key={`cell-proj-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Nota Fiscal Stats Display */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100">Situação das Notas Fiscais</h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Consolidado de faturamento e obrigações fiscais</p>
          </div>

          <div className="grid grid-cols-3 gap-3 my-6 text-center">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-500/5">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">{nfEmitidas}</span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase block mt-1">Emitidas</span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/10 rounded-2xl border border-amber-500/5">
              <span className="text-2xl font-black text-amber-500 block">{nfPendentes}</span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase block mt-1">Pendentes</span>
            </div>
            <div className="p-3 bg-zinc-100/50 dark:bg-zinc-800/40 rounded-2xl">
              <span className="text-2xl font-black text-gray-500 dark:text-zinc-400 block">{nfNaoNecessarias}</span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase block mt-1">Não Precisa</span>
            </div>
          </div>

          <div className="text-xs text-gray-400 dark:text-zinc-500 leading-relaxed pt-3 border-t border-gray-50 dark:border-zinc-800/40">
            Acompanhe o faturamento que ainda exige emissão de notas para manter-se em dia. Você pode alterar a situação da Nota Fiscal editando qualquer recebimento no painel.
          </div>
        </div>

      </div>

      {/* Receita por Categoria & Origem (Visual Progress Indicators - stunning craft) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Receita por Categoria */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100">Receita por Categoria</h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Divisão do faturamento por tipo de serviço</p>
          </div>

          <div className="space-y-3.5">
            {receitaCategoriaData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-12">Nenhum recebimento registrado.</p>
            ) : (
              receitaCategoriaData.map((item, idx) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    <span>{item.name}</span>
                    <span>{formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Receita por Origem */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100">Receita por Origem do Faturamento</h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Distribuição por modelo de faturamento</p>
          </div>

          <div className="space-y-3.5">
            {receitaOrigemData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-12">Nenhum recebimento registrado.</p>
            ) : (
              receitaOrigemData.map((item, idx) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    <span>{item.name}</span>
                    <span>{formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
