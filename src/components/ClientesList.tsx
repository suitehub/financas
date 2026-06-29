import React, { useState } from 'react';
import {
  Users,
  Plus,
  X,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  DollarSign,
  ChevronRight,
  TrendingUp,
  FileText,
  Clock,
  Trash2
} from 'lucide-react';
import { Cliente, Projeto, Recebimento } from '../types';

interface ClientesListProps {
  clientes: Cliente[];
  projetos: Projeto[];
  recebimentos: Recebimento[];
  onAddCliente: (nome: string, email?: string, telefone?: string) => Promise<Cliente>;
  onDeleteCliente: (id: string) => Promise<void>;
}

export default function ClientesList({
  clientes,
  projetos,
  recebimentos,
  onAddCliente,
  onDeleteCliente
}: ClientesListProps) {
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  // Add Client state
  const [showAddModal, setShowAddModal] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nome.trim()) {
      setError('Por favor, informe o nome do cliente.');
      return;
    }

    try {
      setLoading(true);
      await onAddCliente(nome.trim(), email.trim() || undefined, telefone.trim() || undefined);
      
      // Reset
      setNome('');
      setEmail('');
      setTelefone('');
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar cliente.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate detailed stats for a client
  const getClienteStats = (c: Cliente) => {
    const clientRecebimentos = recebimentos.filter(r => r.clienteId === c.id);
    const clientProjetos = projetos.filter(p => p.clienteId === c.id);

    // Total faturado (Recebidos)
    const totalFaturado = clientRecebimentos
      .filter(r => r.status === 'Recebido')
      .reduce((sum, r) => sum + r.valor, 0);

    // Valor ainda a receber (A Receber)
    const valorAReceber = clientRecebimentos
      .filter(r => r.status === 'A Receber')
      .reduce((sum, r) => sum + r.valor, 0);

    // Último pagamento (Most recent paid transaction)
    const paidRecs = clientRecebimentos
      .filter(r => r.status === 'Recebido' && r.dataRecebimento)
      .sort((a, b) => (b.dataRecebimento || '').localeCompare(a.dataRecebimento || ''));

    const ultimoPagamento = paidRecs.length > 0 ? paidRecs[0] : null;

    return {
      totalFaturado,
      valorAReceber,
      qtdProjetos: clientProjetos.length,
      ultimoPagamento,
      historico: clientRecebimentos.sort((a, b) => b.dataPrevista.localeCompare(a.dataPrevista))
    };
  };

  const selectedCliente = clientes.find(c => c.id === selectedClienteId);
  const selectedStats = selectedCliente ? getClienteStats(selectedCliente) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Primary Clients List */}
      <div className={`space-y-4 ${selectedClienteId ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xs">
          <div>
            <h2 className="text-lg font-black text-gray-950 dark:text-zinc-50 tracking-tight">Meus Clientes</h2>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Cadastre e gerencie a carteira de parceiros de negócios.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Novo Cliente</span>
          </button>
        </div>

        {/* Grid cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clientes.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-12 text-center text-gray-400 dark:text-zinc-500 text-xs sm:col-span-2">
              Nenhum cliente cadastrado. Clique em Novo Cliente para cadastrar.
            </div>
          ) : (
            clientes.map((c) => {
              const stats = getClienteStats(c);
              const isSelected = c.id === selectedClienteId;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClienteId(c.id)}
                  className={`bg-white dark:bg-zinc-900 rounded-3xl border p-5 hover:shadow-md hover:border-emerald-250 dark:hover:border-zinc-750 transition-all text-left flex flex-col justify-between gap-4 cursor-pointer relative ${
                    isSelected ? 'ring-2 ring-emerald-500 border-transparent dark:border-transparent' : 'border-gray-100 dark:border-zinc-850'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-black text-gray-950 dark:text-zinc-50 truncate leading-snug">
                        {c.nome}
                      </h3>
                      {c.email && (
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 block truncate font-medium">
                          {c.email}
                        </span>
                      )}
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 rounded-xl">
                      <Users size={16} />
                    </div>
                  </div>

                  {/* High level stats summary */}
                  <div className="grid grid-cols-2 gap-3.5 border-t border-gray-50 dark:border-zinc-800/60 pt-3 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold block">Faturado</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        {formatCurrency(stats.totalFaturado)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold block">A Receber</span>
                      <span className="text-xs font-black text-amber-500 block mt-0.5">
                        {formatCurrency(stats.valorAReceber)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-zinc-500 border-t border-gray-50/50 dark:border-zinc-800/40 pt-2">
                    <span>{stats.qtdProjetos} {stats.qtdProjetos === 1 ? 'projeto' : 'projetos'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      Ver página <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Client Dedicated Page Slide over / column */}
      {selectedCliente && selectedStats && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm flex flex-col justify-between space-y-6 lg:col-span-1 animate-fade-in-right">
          <div className="space-y-6">
            
            {/* Header section of the client page */}
            <div className="flex justify-between items-start border-b border-gray-50 dark:border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest block">
                  PÁGINA DO CLIENTE
                </span>
                <h3 className="text-base font-black text-gray-950 dark:text-zinc-50 mt-1 leading-tight">
                  {selectedCliente.nome}
                </h3>
                
                {/* Contact options */}
                <div className="space-y-1 mt-2.5">
                  {selectedCliente.email && (
                    <span className="text-[11px] text-gray-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                      <Mail size={12} className="text-gray-400" /> {selectedCliente.email}
                    </span>
                  )}
                  {selectedCliente.telefone && (
                    <span className="text-[11px] text-gray-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                      <Phone size={12} className="text-gray-400" /> {selectedCliente.telefone}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedClienteId(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Financial indicators of this client */}
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-2xl border border-emerald-500/5">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-black block">Total Faturado</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                  {formatCurrency(selectedStats.totalFaturado)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/40 rounded-2xl">
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold block">Projetos</span>
                  <span className="text-sm font-black text-gray-900 dark:text-zinc-100 block mt-1">
                    {selectedStats.qtdProjetos}
                  </span>
                </div>
                <div className="p-3.5 bg-amber-50/40 dark:bg-amber-950/10 rounded-2xl">
                  <span className="text-[10px] text-amber-500 uppercase font-bold block">A Receber</span>
                  <span className="text-sm font-black text-amber-500 block mt-1">
                    {formatCurrency(selectedStats.valorAReceber)}
                  </span>
                </div>
              </div>

              {selectedStats.ultimoPagamento && (
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-zinc-200/20">
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold block">Último Pagamento</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                    {formatCurrency(selectedStats.ultimoPagamento.valor)}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Data: {selectedStats.ultimoPagamento.dataRecebimento}
                  </span>
                </div>
              )}
            </div>

            {/* Complete history of receipts for this client */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                Histórico Completo
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedStats.historico.length === 0 ? (
                  <p className="text-[11px] text-gray-400 text-center py-4">Nenhum faturamento registrado.</p>
                ) : (
                  selectedStats.historico.map(r => (
                    <div key={r.id} className="p-3 rounded-xl border border-gray-50 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-900/20 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-zinc-100 block truncate">{r.projetoNome}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{r.dataPrevista} • {r.categoria}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-black block ${r.status === 'Recebido' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                          {formatCurrency(r.valor)}
                        </span>
                        <span className="text-[9px] text-gray-400 block">
                          {r.status === 'Recebido' ? '✅ Pago' : '🟡 A Receber'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center text-xs">
            <button
              onClick={() => {
                if (confirm('Deseja excluir este cliente? Certifique-se de que não existem projetos ou faturamentos vinculados.')) {
                  onDeleteCliente(selectedCliente.id);
                  setSelectedClienteId(null);
                }
              }}
              className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Excluir Cliente
            </button>
            <span className="text-[10px] text-gray-400">Desde: {selectedCliente.createdAt.split('T')[0]}</span>
          </div>

        </div>
      )}

      {/* NEW CLIENT ADD DIALOG */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-2xl p-6 relative">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50 dark:border-zinc-800">
              <h3 className="text-base font-bold text-gray-950 dark:text-zinc-50">Cadastrar Novo Cliente</h3>
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
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase mb-1">Nome do Cliente / Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clínica ABC"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase mb-1">E-mail (Opcional)</label>
                <input
                  type="email"
                  placeholder="Ex: contato@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase mb-1">Telefone (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: (11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
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
                  {loading ? 'Cadastrando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
