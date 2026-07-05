import React, { useState } from 'react';
import {
  Settings,
  Target,
  Download,
  Upload,
  RefreshCcw,
  ShieldAlert,
  Database,
  Check,
  TrendingUp,
  Sliders,
  Sparkles
} from 'lucide-react';
import { Cliente, Projeto, Recebimento } from '../types';

interface ConfiguracoesProps {
  clientes: Cliente[];
  projetos: Projeto[];
  recebimentos: Recebimento[];
  sidebarGoal: number;
  setSidebarGoal: (val: number) => void;
  onResetData: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Configuracoes({
  clientes,
  projetos,
  recebimentos,
  sidebarGoal,
  setSidebarGoal,
  onResetData,
  onExportBackup,
  onImportBackup
}: ConfiguracoesProps) {
  const [goalInput, setGoalInput] = useState<string>(sidebarGoal.toString());
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(goalInput);
    if (!isNaN(val) && val > 0) {
      setSidebarGoal(val);
      localStorage.setItem('suitehub_meta_mensal', val.toString());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } else {
      alert('Por favor, insira um valor de meta mensal válido.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Stats for preview
  const now = new Date();
  const currentYearStr = now.getFullYear().toString();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const faturamentoMes = recebimentos
    .filter(r => r.status === 'Recebido' && r.dataRecebimento && r.dataRecebimento.startsWith(`${currentYearStr}-${currentMonthStr}`))
    .reduce((sum, r) => sum + r.valor, 0);

  const progressPercent = Math.min(Math.round((faturamentoMes / sidebarGoal) * 100), 100);

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <Settings className="text-emerald-500" size={20} />
            Configurações
          </h2>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Configure metas financeiras, gerencie backups e redefina o sistema.</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-zinc-800 rounded-full border border-slate-100 dark:border-zinc-850/60 text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
          <Sliders size={12} />
          Painel de Controle
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Próxima Meta Configuration Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800/80 p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-2xl">
                <Target size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100">Meta Financeira Mensal</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500">Defina o faturamento mensal desejado para acompanhar no progresso geral.</p>
              </div>
            </div>

            <form onSubmit={handleSaveGoal} className="flex flex-col sm:flex-row items-end gap-3.5 pt-2">
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                  Valor da Meta Mensal (R$)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-850 rounded-2xl text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-bold"
                  placeholder="Ex: 15000"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black rounded-2xl text-xs transition-colors shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                {isSaved ? (
                  <>
                    <Check size={14} />
                    <span>Salvo!</span>
                  </>
                ) : (
                  <span>Atualizar Meta</span>
                )}
              </button>
            </form>

            {/* Meta Preview Widget */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-850/60 border border-slate-100 dark:border-zinc-800/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles size={12} className="text-emerald-500" />
                  Visualização de Progresso (Mês Atual)
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">Mês {currentMonthStr}/{currentYearStr}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-lg font-black text-slate-800 dark:text-zinc-100">
                    {formatCurrency(faturamentoMes)} <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500">faturados</span>
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-bold mt-0.5">
                    Meta Ativa: {formatCurrency(sidebarGoal)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{progressPercent}%</span>
                  <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold">concluído</p>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-zinc-700/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Database Integration guidelines */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800/80 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-2xl">
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100">Banco de Dados em Nuvem</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500">Substitua o armazenamento local pelo Firestore ou PostgreSQL.</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              Atualmente, seus dados são armazenados de forma 100% segura e privada diretamente no armazenamento local do seu navegador (<strong className="font-bold">localStorage</strong>). Como você mencionou que irá integrar em breve com o banco de dados:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-850/60 border border-slate-100 dark:border-zinc-800/80 rounded-2xl text-[11px] space-y-1">
                <span className="font-black text-slate-700 dark:text-zinc-300 block uppercase tracking-wider text-[10px]">1. Firebase Integration</span>
                <p className="text-gray-400 dark:text-zinc-500 leading-normal">
                  Utilize o SDK do Firebase em <strong className="font-semibold">/src/services/dbService.ts</strong> para criar coleções auto-syncadas.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-850/60 border border-slate-100 dark:border-zinc-800/80 rounded-2xl text-[11px] space-y-1">
                <span className="font-black text-slate-700 dark:text-zinc-300 block uppercase tracking-wider text-[10px]">2. Custom API Integration</span>
                <p className="text-gray-400 dark:text-zinc-500 leading-normal">
                  Basta trocar as requisições locais por chamadas HTTP utilizando <strong className="font-semibold">fetch/axios</strong> conectando ao seu backend Express.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Backup & Redefinition Section */}
        <div className="space-y-6">
          
          {/* Backup Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800/80 p-6 space-y-5 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100">Backup & Restauração</h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Exporte ou importe seus dados em arquivos JSON de forma offline.</p>
            </div>

            <div className="space-y-2">
              {/* Export */}
              <button
                onClick={onExportBackup}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 rounded-2xl text-xs font-black text-slate-700 dark:text-zinc-200 border border-slate-100/50 dark:border-zinc-800 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Download size={16} className="text-emerald-500" />
                  <span>Exportar Dados</span>
                </div>
                <span className="text-[10px] bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-zinc-800 font-extrabold text-slate-400 dark:text-zinc-500 group-hover:text-emerald-500 transition-colors">JSON</span>
              </button>

              {/* Import */}
              <label
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 rounded-2xl text-xs font-black text-slate-700 dark:text-zinc-200 border border-slate-100/50 dark:border-zinc-800 transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Upload size={16} className="text-indigo-500" />
                  <span>Importar Backup</span>
                </div>
                <span className="text-[10px] bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-zinc-800 font-extrabold text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors">JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
              <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-normal font-medium">
                💡 <strong className="font-extrabold">Dica:</strong> Salve backups periódicos de seus faturamentos e clientes para garantir que não perderá nada caso limpe o histórico do seu navegador.
              </p>
            </div>
          </div>

          {/* Reset App Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-150 dark:border-zinc-800/80 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="text-red-500" size={18} />
              <h3 className="text-xs font-black text-red-500 dark:text-red-400 uppercase tracking-wider">Zona de Perigo</h3>
            </div>

            <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">
              Redefinir o aplicativo irá apagar completamente todos os clientes cadastrados, projetos associados e recebimentos sem possibilidade de restauração manual.
            </p>

            <button
              onClick={onResetData}
              className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/10 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-black rounded-2xl text-xs transition-colors cursor-pointer border border-red-100/30 dark:border-red-900/20 flex items-center justify-center gap-1.5"
            >
              <RefreshCcw size={13} />
              <span>Redefinir Aplicativo</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
