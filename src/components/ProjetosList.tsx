import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Plus,
  ArrowRight,
  ChevronRight,
  X,
  PlusCircle,
  HelpCircle,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { Cliente, Projeto, Recebimento, StatusProjetoType } from '../types';

interface ProjetosListProps {
  projetos: Projeto[];
  clientes: Cliente[];
  recebimentos: Recebimento[];
  onAddProjeto: (projeto: Omit<Projeto, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onUpdateProjetoStatus: (id: string, status: StatusProjetoType) => Promise<void>;
  onDeleteProjeto: (id: string) => Promise<void>;
}

const STATUS_OPTIONS: StatusProjetoType[] = [
  'Planejamento',
  'Desenvolvimento',
  'Testes',
  'Entregue',
  'Suporte'
];

export default function ProjetosList({
  projetos,
  clientes,
  recebimentos,
  onAddProjeto,
  onUpdateProjetoStatus,
  onDeleteProjeto
}: ProjetosListProps) {
  const [selectedProjetoId, setSelectedProjetoId] = useState<string | null>(null);
  
  // Create Project dialog state
  const [showAddModal, setShowAddModal] = useState(false);
  const [nome, setNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [categoria, setCategoria] = useState('Sistema Web');
  const [valorContratado, setValorContratado] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<StatusProjetoType>('Planejamento');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nome.trim()) {
      setError('Por favor, insira o nome do projeto.');
      return;
    }
    if (!clienteId) {
      setError('Por favor, selecione um cliente.');
      return;
    }
    if (!valorContratado || parseFloat(valorContratado) <= 0) {
      setError('Por favor, insira o valor do contrato.');
      return;
    }

    try {
      setLoading(true);
      const selCliente = clientes.find(c => c.id === clienteId);
      if (!selCliente) throw new Error('Cliente inválido.');

      await onAddProjeto({
        nome: nome.trim(),
        clienteId,
        clienteNome: selCliente.nome,
        categoria,
        valorContratado: parseFloat(valorContratado),
        dataInicio,
        status
      });

      // Reset
      setNome('');
      setClienteId('');
      setValorContratado('');
      setDataInicio(new Date().toISOString().split('T')[0]);
      setStatus('Planejamento');
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar projeto.');
    } finally {
      setLoading(false);
    }
  };

  // Get project details
  const getProjectMetrics = (p: Projeto) => {
    const projectRecebimentos = recebimentos.filter(r => r.projetoId === p.id);
    const valorRecebido = projectRecebimentos
      .filter(r => r.status === 'Recebido')
      .reduce((sum, r) => sum + r.valor, 0);
    const valorPendente = projectRecebimentos
      .filter(r => r.status === 'A Receber')
      .reduce((sum, r) => sum + r.valor, 0);

    return {
      valorRecebido,
      valorPendente,
      recebimentosList: projectRecebimentos
    };
  };

  const selectedProjeto = projetos.find(p => p.id === selectedProjetoId);
  const selectedMetrics = selectedProjeto ? getProjectMetrics(selectedProjeto) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Primary Projects List (2 Cols on desktop) */}
      <div className={`space-y-4 ${selectedProjetoId ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xs">
          <div>
            <h2 className="text-lg font-black text-gray-950 dark:text-zinc-50 tracking-tight">Projetos Ativos</h2>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Desenvolva propostas, controle marcos e gerencie entregas.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Novo Projeto</span>
          </button>
        </div>

        {/* List of projects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projetos.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-12 text-center text-gray-400 dark:text-zinc-500 text-xs sm:col-span-2">
              Nenhum projeto cadastrado. Adicione um novo projeto para começar.
            </div>
          ) : (
            projetos.map((p) => {
              const metrics = getProjectMetrics(p);
              const isSelected = p.id === selectedProjetoId;
              
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProjetoId(p.id)}
                  className={`bg-white dark:bg-zinc-900 rounded-3xl border p-5 hover:shadow-md hover:border-emerald-250 dark:hover:border-zinc-700 transition-all text-left flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden ${
                    isSelected ? 'ring-2 ring-emerald-500 border-transparent dark:border-transparent' : 'border-gray-100 dark:border-zinc-850'
                  }`}
                >
                  {/* Category Pill / status */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 font-bold px-2 py-0.5 rounded">
                      {p.categoria}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      p.status === 'Entregue'
                        ? 'bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400'
                        : p.status === 'Desenvolvimento'
                        ? 'bg-blue-50 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400'
                        : 'bg-zinc-100 dark:bg-zinc-850 text-gray-500 dark:text-zinc-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-sm font-black text-gray-950 dark:text-zinc-50 truncate leading-tight">
                      {p.nome}
                    </h3>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 flex items-center gap-1 mt-1 font-medium">
                      <Users size={11} /> {p.clienteNome}
                    </p>
                  </div>

                  {/* Value bar display */}
                  <div className="space-y-1.5 border-t border-gray-50 dark:border-zinc-800/60 pt-3">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400 dark:text-zinc-500">Contratado:</span>
                      <span className="font-bold text-gray-950 dark:text-zinc-100">{formatCurrency(p.valorContratado)}</span>
                    </div>

                    <div className="flex justify-between text-[10px]">
                      <span className="text-emerald-600 dark:text-emerald-400">Recebido:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(metrics.valorRecebido)}</span>
                    </div>

                    {metrics.valorPendente > 0 && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-amber-500">Pendente:</span>
                        <span className="font-bold text-amber-500">{formatCurrency(metrics.valorPendente)}</span>
                      </div>
                    )}
                  </div>

                  {/* Link action indicator */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={10} /> Início: {p.dataInicio}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                      Ver detalhes <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Project Details Column Page */}
      {selectedProjeto && selectedMetrics && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm flex flex-col justify-between space-y-6 lg:col-span-1 animate-fade-in-right">
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-gray-50 dark:border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest block">
                  PÁGINA DO PROJETO
                </span>
                <h3 className="text-base font-black text-gray-950 dark:text-zinc-50 mt-1 leading-tight">
                  {selectedProjeto.nome}
                </h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
                  Cliente: {selectedProjeto.clienteNome}
                </span>
              </div>
              <button
                onClick={() => setSelectedProjetoId(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Metrics display inside project page */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-2xl">
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold block">Contratado</span>
                <span className="text-xs font-black text-gray-900 dark:text-zinc-100 block mt-1">
                  {formatCurrency(selectedProjeto.valorContratado)}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Recebido</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                  {formatCurrency(selectedMetrics.valorRecebido)}
                </span>
              </div>
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl col-span-2">
                <span className="text-[10px] text-amber-500 uppercase font-bold block">Pendente</span>
                <span className="text-xs font-black text-amber-500 block mt-1">
                  {formatCurrency(selectedMetrics.valorPendente)}
                </span>
              </div>
            </div>

            {/* Change Status Form directly in details page */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">
                Alterar Status
              </label>
              <select
                value={selectedProjeto.status}
                onChange={(e) => onUpdateProjetoStatus(selectedProjeto.id, e.target.value as StatusProjetoType)}
                className="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-transparent rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Histórico de Recebimentos do Projeto */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                Histórico de Recebimentos
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedMetrics.recebimentosList.length === 0 ? (
                  <p className="text-[11px] text-gray-400 text-center py-4">Nenhum faturamento registrado para este projeto.</p>
                ) : (
                  selectedMetrics.recebimentosList.map(r => (
                    <div key={r.id} className="p-2.5 rounded-xl border border-gray-50 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-900/20 flex justify-between items-center text-xs">
                      <div className="min-w-0">
                        <span className="font-semibold block text-gray-900 dark:text-zinc-100 truncate">{r.categoria}</span>
                        <span className="text-[10px] text-gray-400 block">{r.dataPrevista}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-black block ${r.status === 'Recebido' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                          {formatCurrency(r.valor)}
                        </span>
                        <span className="text-[9px] text-gray-400 block">
                          {r.status === 'Recebido' ? '✅ Pago' : '🟡 Pendente'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
            <button
              onClick={() => {
                if (confirm('Deseja excluir este projeto? Faturamentos associados não serão apagados automaticamente.')) {
                  onDeleteProjeto(selectedProjeto.id);
                  setSelectedProjetoId(null);
                }
              }}
              className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Excluir Projeto
            </button>
            <span className="text-[10px] text-gray-400">Criado: {selectedProjeto.dataInicio}</span>
          </div>
        </div>
      )}

      {/* NEW PROJECT ADD DIALOG */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-2xl p-6 relative">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50 dark:border-zinc-800">
              <h3 className="text-base font-bold text-gray-950 dark:text-zinc-50">Cadastrar Novo Projeto</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
              >
                <X size={18} />
              </button>
            </div>

            {error && <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30 mb-4">{error}</p>}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase mb-1">Nome do Projeto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Novo E-commerce"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase mb-1">Cliente</label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">Selecione o Cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase mb-1">Categoria</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Desenvolvimento">Desenvolvimento</option>
                    <option value="Aplicativo">Aplicativo</option>
                    <option value="Sistema Web">Sistema Web</option>
                    <option value="Landing Page">Landing Page</option>
                    <option value="Mensalidade">Mensalidade</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Design">Design</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase mb-1">Valor Contrato (R$)</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={valorContratado}
                    onChange={(e) => setValorContratado(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase mb-1">Data de Início</label>
                  <input
                    type="date"
                    required
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase mb-1">Status Inicial</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusProjetoType)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-zinc-850 rounded-xl bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                >
                  {loading ? 'Cadastrando...' : 'Salvar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
