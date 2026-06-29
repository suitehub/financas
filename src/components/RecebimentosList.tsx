import React, { useState } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Calendar,
  X,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Briefcase,
  ChevronDown
} from 'lucide-react';
import { Cliente, Projeto, Recebimento, CategoriaType, OrigemType, FormaPagamentoType, StatusRecebimentoType, NotaFiscalType } from '../types';

interface RecebimentosListProps {
  recebimentos: Recebimento[];
  clientes: Cliente[];
  projetos: Projeto[];
  onAddRecebimento: () => void;
  onEditRecebimento: (recebimento: Recebimento) => void;
  onDeleteRecebimento: (id: string) => void;
}

export default function RecebimentosList({
  recebimentos,
  clientes,
  projetos,
  onAddRecebimento,
  onEditRecebimento,
  onDeleteRecebimento
}: RecebimentosListProps) {
  // Search
  const [search, setSearch] = useState('');

  // Filters visibility
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [filterClienteId, setFilterClienteId] = useState('');
  const [filterProjetoId, setFilterProjetoId] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterOrigem, setFilterOrigem] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFormaPagamento, setFilterFormaPagamento] = useState('');
  const [filterNotaFiscal, setFilterNotaFiscal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Categories lists
  const CATEGORIES: CategoriaType[] = [
    'Desenvolvimento', 'Aplicativo', 'Sistema Web', 'Landing Page',
    'Mensalidade', 'Manutenção', 'Consultoria', 'Design', 'Outro'
  ];

  const ORIGENS: OrigemType[] = [
    '💻 Desenvolvimento sob demanda', '📱 Aplicativos', '🌐 Sistemas Web',
    '🔄 Assinaturas (SaaS)', '🛠️ Manutenção', '🎨 Design', '📚 Outros'
  ];

  const PAYMENTS: FormaPagamentoType[] = ['Pix', 'Cartão', 'Transferência', 'Dinheiro', 'Outro'];

  // Clear filters
  const handleClearFilters = () => {
    setFilterClienteId('');
    setFilterProjetoId('');
    setFilterCategoria('');
    setFilterOrigem('');
    setFilterStatus('');
    setFilterFormaPagamento('');
    setFilterNotaFiscal('');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  // Filter Logic
  const filtered = recebimentos.filter(r => {
    // Search matching
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      r.clienteNome.toLowerCase().includes(q) ||
      r.projetoNome.toLowerCase().includes(q) ||
      r.categoria.toLowerCase().includes(q) ||
      (r.observacoes && r.observacoes.toLowerCase().includes(q));

    // Filters matching
    const matchesCliente = !filterClienteId || r.clienteId === filterClienteId;
    const matchesProjeto = !filterProjetoId || r.projetoId === filterProjetoId;
    const matchesCategoria = !filterCategoria || r.categoria === filterCategoria;
    const matchesOrigem = !filterOrigem || r.origem === filterOrigem;
    const matchesStatus = !filterStatus || r.status === filterStatus;
    const matchesFormaPagamento = !filterFormaPagamento || r.formaPagamento === filterFormaPagamento;
    const matchesNotaFiscal = !filterNotaFiscal || r.notaFiscal === filterNotaFiscal;

    // Date range
    const matchesStartDate = !startDate || r.dataPrevista >= startDate;
    const matchesEndDate = !endDate || r.dataPrevista <= endDate;

    return matchesSearch &&
      matchesCliente &&
      matchesProjeto &&
      matchesCategoria &&
      matchesOrigem &&
      matchesStatus &&
      matchesFormaPagamento &&
      matchesNotaFiscal &&
      matchesStartDate &&
      matchesEndDate;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-5">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-gray-950 dark:text-zinc-50 tracking-tight">
            Recebimentos & Faturamento
          </h2>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            Acompanhe o status e administre todas as transações cadastradas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              showFilters || filterClienteId || filterProjetoId || filterCategoria || filterOrigem || filterStatus || filterFormaPagamento || filterNotaFiscal || startDate || endDate
                ? 'bg-emerald-50 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                : 'border-gray-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filtros {showFilters ? 'Abertos' : ''}</span>
          </button>
          <button
            id="list-add-recebimento-btn"
            onClick={onAddRecebimento}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-5 shadow-xs space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-zinc-800/80 pb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={14} /> Painel de Filtros Avançados
            </span>
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
            >
              Limpar Tudo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cliente */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Cliente</label>
              <select
                value={filterClienteId}
                onChange={(e) => setFilterClienteId(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todos</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            {/* Projeto */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Projeto</label>
              <select
                value={filterProjetoId}
                onChange={(e) => setFilterProjetoId(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todos</option>
                {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            {/* Categoria */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Categoria</label>
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todas</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Origem do faturamento */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Origem do Faturamento</label>
              <select
                value={filterOrigem}
                onChange={(e) => setFilterOrigem(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todas</option>
                {ORIGENS.map(ori => <option key={ori} value={ori}>{ori}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todos</option>
                <option value="Recebido">🟢 Recebido</option>
                <option value="A Receber">🟡 A Receber</option>
              </select>
            </div>

            {/* Forma de pagamento */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Forma de Pagamento</label>
              <select
                value={filterFormaPagamento}
                onChange={(e) => setFilterFormaPagamento(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todas</option>
                {PAYMENTS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
              </select>
            </div>

            {/* Nota Fiscal */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Nota Fiscal</label>
              <select
                value={filterNotaFiscal}
                onChange={(e) => setFilterNotaFiscal(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todas</option>
                <option value="Emitida">Emitida</option>
                <option value="Pendente">Pendente</option>
                <option value="Não Necessária">Não Necessária</option>
              </select>
            </div>

            {/* Datas */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Período Previsto</label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 rounded-lg px-1.5 py-1 text-[11px] text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
                <span className="text-gray-400 dark:text-zinc-600 text-xs">até</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 rounded-lg px-1.5 py-1 text-[11px] text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Quick Search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-zinc-500 pointer-events-none">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Filtrar por texto rápido nas transações..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none focus:border-emerald-500 text-gray-900 dark:text-zinc-100 placeholder-gray-400 transition-all shadow-xs"
        />
      </div>

      {/* Transactions Count Header */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
          Exibindo {filtered.length} recebimentos
        </span>
        {(filterClienteId || filterProjetoId || filterCategoria || filterOrigem || filterStatus || filterFormaPagamento || filterNotaFiscal || startDate || endDate || search) && (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
            Filtros ativos
          </span>
        )}
      </div>

      {/* List content */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-12 text-center text-gray-400 dark:text-zinc-500 text-xs">
            Nenhum recebimento localizado com as condições especificadas.
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800/80 p-5 shadow-xs hover:shadow-md hover:border-gray-200 dark:hover:border-zinc-750 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              
              {/* Left detail area */}
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                  r.status === 'Recebido'
                    ? 'bg-emerald-50 dark:bg-emerald-950/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-950/15 text-amber-600 dark:text-amber-400 animate-pulse'
                }`}>
                  <DollarSign size={20} />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-gray-950 dark:text-zinc-50 truncate">
                      {r.clienteNome}
                    </h3>
                    <span className="text-[10px] bg-gray-50 dark:bg-zinc-800/60 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-md font-semibold">
                      {r.categoria}
                    </span>
                    <span className="text-[10px] bg-slate-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-md">
                      {r.formaPagamento}
                    </span>
                    {r.parcelado && (
                      <span className="text-[10px] bg-sky-50 dark:bg-sky-950/25 text-sky-600 dark:text-sky-400 border border-sky-100/60 dark:border-sky-900/30 px-2 py-0.5 rounded-md font-black">
                        Parcela {r.parcelaAtual}/{r.totalParcelas}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400 font-medium">
                    <Briefcase size={12} className="text-gray-400" />
                    <span className="truncate">{r.projetoNome}</span>
                  </div>

                  {/* Notes & NF summary */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-zinc-500">
                    <span className="flex items-center gap-0.5">
                      <FileText size={10} /> NF: {r.notaFiscal === 'Emitida' ? `Emitida (${r.nfNumero})` : r.notaFiscal === 'Pendente' ? 'Pendente' : 'Não Precisa'}
                    </span>
                    {r.observacoes && (
                      <span className="truncate max-w-[200px]">
                        • {r.observacoes}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right finance / control area */}
              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-gray-50 dark:border-zinc-800/60 pt-3 md:pt-0">
                <div className="text-left md:text-right">
                  <span className={`text-lg font-black block leading-none font-sans ${
                    r.status === 'Recebido' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                  }`}>
                    {formatCurrency(r.valor)}
                  </span>
                  <div className="flex items-center md:justify-end gap-1.5 mt-1 text-[11px] text-gray-400 dark:text-zinc-500">
                    <Calendar size={12} />
                    <span>{r.status === 'Recebido' ? `Pago em ${r.dataRecebimento}` : `Previsto para ${r.dataPrevista}`}</span>
                  </div>
                </div>

                {/* Edit & Delete CTA Actions */}
                <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditRecebimento(r)}
                    className="p-2 text-gray-400 dark:text-zinc-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 rounded-xl transition-all cursor-pointer"
                    title="Editar recebimento"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este recebimento?')) {
                        onDeleteRecebimento(r.id);
                      }
                    }}
                    className="p-2 text-gray-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/10 rounded-xl transition-all cursor-pointer"
                    title="Excluir recebimento"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
