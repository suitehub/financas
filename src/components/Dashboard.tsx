import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Percent,
  CalendarDays,
  ChevronRight,
  FileText
} from 'lucide-react';
import { Cliente, Projeto, Recebimento } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  clientes: Cliente[];
  projetos: Projeto[];
  recebimentos: Recebimento[];
  onOpenNewRecebimento: () => void;
  onNavigateTo: (tab: string, itemDetailId?: string) => void;
}

export default function Dashboard({
  clientes,
  projetos,
  recebimentos,
  onOpenNewRecebimento,
  onNavigateTo
}: DashboardProps) {

  // Current Date context
  const currentYearStr = '2026';
  const currentMonthStr = '06'; // June

  // --- STATS CALCULATIONS ---

  // Faturamento do Mês (Received in current month: 2026-06)
  const faturamentoMes = recebimentos
    .filter(r => r.status === 'Recebido' && r.dataRecebimento && r.dataRecebimento.startsWith(`${currentYearStr}-${currentMonthStr}`))
    .reduce((sum, r) => sum + r.valor, 0);

  const aReceberMes = recebimentos
    .filter(r => r.status === 'A Receber' && r.dataPrevista.startsWith(`${currentYearStr}-${currentMonthStr}`))
    .reduce((sum, r) => sum + r.valor, 0);

  // Faturamento do Ano (Received in current year: 2026)
  const faturamentoAno = recebimentos
    .filter(r => r.status === 'Recebido' && r.dataRecebimento && r.dataRecebimento.startsWith(currentYearStr))
    .reduce((sum, r) => sum + r.valor, 0);

  // Total a Receber (All times pending)
  const totalAReceber = recebimentos
    .filter(r => r.status === 'A Receber')
    .reduce((sum, r) => sum + r.valor, 0);

  // Active Clients (Distinct clients with at least one project not fully complete or any client)
  const totalClientes = clientes.length;

  // Active Projects (Projects not fully "Entregue")
  const projetosAtivos = projetos.filter(p => p.status !== 'Entregue').length;

  // Last 5 registered/previstos payments
  const ultimosRecebimentos = [...recebimentos]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // --- CHART EVOLUTION (Last 6 Months) ---
  const getEvolucaoData = () => {
    // Generate last 6 months key strings
    // E.g., for June 2026: Jan, Feb, Mar, Apr, May, Jun
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data: { name: string; Faturado: number; Pendente: number }[] = [];

    const baseDate = new Date(2026, 5, 29); // June 2026
    for (let i = 5; i >= 0; i--) {
      const d = new Date(2026, 5 - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
      const yearMonthKey = `${year}-${monthStr}`;

      const faturadoNoMes = recebimentos
        .filter(r => r.status === 'Recebido' && r.dataRecebimento && r.dataRecebimento.startsWith(yearMonthKey))
        .reduce((sum, r) => sum + r.valor, 0);

      const pendenteNoMes = recebimentos
        .filter(r => r.status === 'A Receber' && r.dataPrevista.startsWith(yearMonthKey))
        .reduce((sum, r) => sum + r.valor, 0);

      data.push({
        name: monthNames[d.getMonth()],
        Faturado: faturadoNoMes,
        Pendente: pendenteNoMes
      });
    }
    return data;
  };

  const chartData = getEvolucaoData();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Hero / Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl shadow-xl border border-slate-800/80 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest bg-emerald-400/10 px-2.5 py-1 rounded-full">
            Painel Financeiro
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-2 font-sans">
            Olá, rickyjorgecastro
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-md">
            Seja bem-vindo ao Suite Hub Finanças. Acompanhe seu faturamento em tempo real e de forma descomplicada.
          </p>
        </div>

        <button
          id="quick-add-recebimento-btn"
          onClick={onOpenNewRecebimento}
          className="relative z-10 self-start sm:self-center bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-100 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus size={18} />
          <span>Novo Recebimento</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Mês Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Faturamento do Mês
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-800 dark:text-zinc-50 tracking-tight font-sans block">
              {formatCurrency(faturamentoMes)}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                + {formatCurrency(aReceberMes)}
              </span>
              <span className="text-gray-400 dark:text-zinc-500">
                previstos para Junho
              </span>
            </div>
          </div>
        </div>

        {/* Ano Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Faturamento do Ano (2026)
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-800 dark:text-zinc-50 tracking-tight font-sans block">
              {formatCurrency(faturamentoAno)}
            </span>
            <span className="text-xs text-gray-400 dark:text-zinc-500 block mt-1.5">
              Soma total faturada líquida recebida
            </span>
          </div>
        </div>

        {/* A Receber Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Total a Receber
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-amber-500 tracking-tight font-sans block">
              {formatCurrency(totalAReceber)}
            </span>
            <span className="text-xs text-gray-400 dark:text-zinc-500 block mt-1.5">
              Valores previstos sem pagamento efetuado
            </span>
          </div>
        </div>

      </div>

      {/* Mini Clientes / Projetos counts */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigateTo('Clientes')}
          className="bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between text-left hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/15 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
              <Users size={16} />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-950 dark:text-zinc-50">{totalClientes}</span>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">Clientes Ativos</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>

        <button
          onClick={() => onNavigateTo('Projetos')}
          className="bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between text-left hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/15 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
              <Briefcase size={16} />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-950 dark:text-zinc-50">{projetosAtivos}</span>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">Projetos em Andamento</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Evolution Chart & Recent Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Evolution Chart */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100">Evolução do Faturamento</h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Últimos meses faturados</p>
            </div>
            <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
              <TrendingUp size={12} /> Crescimento
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFaturado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#888888' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000) + 'k' : v}`}
                  tick={{ fontSize: 11, fill: '#888888' }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Faturado']}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Faturado"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFaturado)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100">Últimos Registros</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500">Histórico rápido</p>
              </div>
              <button
                onClick={() => onNavigateTo('Recebimentos')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Ver todos <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-3.5">
              {ultimosRecebimentos.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
                  Nenhum recebimento cadastrado.
                </div>
              ) : (
                ultimosRecebimentos.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onNavigateTo('Recebimentos')}
                    className="group flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-all cursor-pointer border border-transparent hover:border-gray-100/60 dark:hover:border-zinc-800/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        r.status === 'Recebido'
                          ? 'bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        <DollarSign size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-950 dark:text-zinc-100 block truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {r.clienteNome}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 block truncate">
                          {r.projetoNome} • {r.categoria}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold block ${
                        r.status === 'Recebido' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                      }`}>
                        {formatCurrency(r.valor)}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-zinc-500 block">
                        {r.dataPrevista}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100/50 dark:border-zinc-800/60 mt-4 text-center">
            <p className="text-[10px] text-gray-400 dark:text-zinc-500">
              Registros integrados com Cloud Firestore
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
