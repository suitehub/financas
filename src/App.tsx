import React, { useState, useEffect } from 'react';
import { dbService } from './services/dbService';
import { Cliente, Projeto, Recebimento, StatusProjetoType } from './types';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, writeBatch } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

// Icons
import {
  Home,
  DollarSign,
  Briefcase,
  Users,
  BarChart2,
  Calendar,
  RotateCcw,
  Plus,
  Moon,
  Sun,
  Loader2,
  TrendingUp,
  Settings,
  LogOut
} from 'lucide-react';

// Components
import ThemeToggle from './components/ThemeToggle';
import SearchGlobal from './components/SearchGlobal';
import Dashboard from './components/Dashboard';
import RecebimentosList from './components/RecebimentosList';
import RecebimentoForm from './components/RecebimentoForm';
import ProjetosList from './components/ProjetosList';
import ClientesList from './components/ClientesList';
import CalendarioFinanceiro from './components/CalendarioFinanceiro';
import Relatorios from './components/Relatorios';
import LoginScreen from './components/LoginScreen';
import Configuracoes from './components/Configuracoes';

type TabType = 'Dashboard' | 'Recebimentos' | 'Projetos' | 'Clientes' | 'Relatorios' | 'Calendario' | 'Configuracoes';

export default function App() {
  // Authentication & Loading state
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // App Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('suitehub-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<TabType>('Dashboard');

  // Próxima Meta state
  const [sidebarGoal, setSidebarGoal] = useState<number>(() => {
    const saved = localStorage.getItem('suitehub_meta_mensal');
    return saved ? parseFloat(saved) : 15000;
  });

  // Core Data Lists
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);

  // Dialog / Modal state
  const [showRecebimentoForm, setShowRecebimentoForm] = useState(false);
  const [editingRecebimento, setEditingRecebimento] = useState<Recebimento | undefined>(undefined);

  // Apply Theme class on mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('suitehub-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Sync user profile in the database
          const syncedUser = await dbService.syncUsuario(user.uid, user.email || '', user.displayName || '');
          setUserId(user.uid);
          setUserName(syncedUser.nome);
        } catch (err) {
          console.error("Error syncing user in database:", err);
          setUserId(user.uid);
          setUserName(user.displayName || user.email?.split('@')[0] || 'Usuário');
        }
        await loadAllUserData(user.uid);
      } else {
        setUserId(null);
        setUserName('');
        setClientes([]);
        setProjetos([]);
        setRecebimentos([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync user data
  const loadAllUserData = async (uid: string) => {
    try {
      setDataLoading(true);
      let userClientes = await dbService.getClientes(uid);
      let userProjetos = await dbService.getProjetos(uid);
      let userRecebimentos = await dbService.getRecebimentos(uid);

      const userProfile = await dbService.getUsuario(uid);

      // If user is new or has no data, and has never had demo data seeded or reset, let's seed demo data to offer a great out-of-the-box experience!
      if (!userProfile?.demoSeeded && userClientes.length === 0 && userProjetos.length === 0 && userRecebimentos.length === 0) {
        const seeded = await dbService.seedDemoData(uid);
        await dbService.updateUsuario(uid, { demoSeeded: true });
        setClientes(seeded.clientes);
        setProjetos(seeded.projetos);
        setRecebimentos(seeded.recebimentos);
      } else {
        setClientes(userClientes);
        setProjetos(userProjetos);
        setRecebimentos(userRecebimentos);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLoginSuccess = async (uid: string, name: string) => {
    setUserId(uid);
    setUserName(name);
    
    // Sync user during successful login manually if auth state is delayed
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const syncedUser = await dbService.syncUsuario(uid, currentUser.email || '', name);
        setUserName(syncedUser.nome);
      } catch (err) {
        console.error("Error syncing user during login success:", err);
      }
    }
    await loadAllUserData(uid);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserId(null);
      setUserName('');
      setClientes([]);
      setProjetos([]);
      setRecebimentos([]);
      setCurrentTab('Dashboard');
    } catch (e) {
      console.error('Error signing out:', e);
    }
  };

  const handleResetData = async () => {
    if (!userId) return;
    if (confirm('Deseja realmente redefinir o aplicativo? Isso apagará todas as suas informações do banco de dados permanentemente, deixando o sistema totalmente limpo.')) {
      setAuthLoading(true);
      try {
        const batch = writeBatch(db);

        clientes.forEach((c) => {
          batch.delete(doc(db, 'clientes', c.id));
        });

        projetos.forEach((p) => {
          batch.delete(doc(db, 'projetos', p.id));
        });

        recebimentos.forEach((r) => {
          batch.delete(doc(db, 'recebimentos', r.id));
        });

        await batch.commit();

        // Mark demoSeeded as true to keep the database fully clean and avoid automatic re-seeding on page load
        await dbService.updateUsuario(userId, { demoSeeded: true });

        setClientes([]);
        setProjetos([]);
        setRecebimentos([]);
      } catch (e) {
        console.error('Error clearing data:', e);
      } finally {
        setAuthLoading(false);
      }
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        clientes,
        projetos,
        recebimentos,
        setupCompleted: 'clean',
        exportedAt: new Date().toISOString()
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `suitehub_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erro ao exportar os dados de backup.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;
        const backupData = JSON.parse(text);

        if (!backupData.clientes || !backupData.projetos || !backupData.recebimentos) {
          alert('Arquivo de backup inválido. Não foi possível carregar os dados.');
          return;
        }

        if (confirm('Importar este backup irá substituir todos os dados atuais do aplicativo. Deseja continuar?')) {
          setAuthLoading(true);
          const currentUserId = userId || 'unknown';
          const batch = writeBatch(db);

          backupData.clientes.forEach((c: any) => {
            batch.set(doc(db, 'clientes', c.id), { ...c, userId: currentUserId });
          });

          backupData.projetos.forEach((p: any) => {
            batch.set(doc(db, 'projetos', p.id), { ...p, userId: currentUserId });
          });

          backupData.recebimentos.forEach((r: any) => {
            batch.set(doc(db, 'recebimentos', r.id), { ...r, userId: currentUserId });
          });

          await batch.commit();
          
          await loadAllUserData(currentUserId);
          setAuthLoading(false);
          alert('Backup importado com sucesso!');
        }
      } catch (err) {
        alert('Erro ao importar o arquivo de backup. Certifique-se de que é um arquivo JSON válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  // --- ACTIONS HANDLERS ---

  // Recebimentos CRUD
  const handleSaveRecebimento = async (payloads: Omit<Recebimento, 'id' | 'userId' | 'createdAt'> | Omit<Recebimento, 'id' | 'userId' | 'createdAt'>[]) => {
    if (!userId) return;
    try {
      setDataLoading(true);
      if (editingRecebimento) {
        const singlePayload = Array.isArray(payloads) ? payloads[0] : payloads;
        await dbService.updateRecebimento(editingRecebimento.id, singlePayload);
      } else {
        if (Array.isArray(payloads)) {
          // Use high performance atomic writeBatch for multiple installment saves to prevent partial failures and sequential delays
          const batch = writeBatch(db);
          for (const p of payloads) {
            const id = Math.random().toString(36).substring(2, 15);
            const novoRecebimento = {
              ...p,
              id,
              userId,
              createdAt: new Date().toISOString()
            };
            const cleaned = {} as any;
            Object.keys(novoRecebimento).forEach((key) => {
              if ((novoRecebimento as any)[key] !== undefined) {
                cleaned[key] = (novoRecebimento as any)[key];
              }
            });
            batch.set(doc(db, 'recebimentos', id), cleaned);
          }
          await batch.commit();
        } else {
          await dbService.addRecebimento(userId, payloads);
        }
      }
      await loadAllUserData(userId);
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Erro ao salvar recebimento.';
      if (err instanceof Error) {
        errorMsg += '\nDetalhes: ' + err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMsg += '\nDetalhes: ' + JSON.stringify(err);
      }
      alert(errorMsg);
    } finally {
      setDataLoading(false);
    }
  };

  const handleDeleteRecebimento = async (id: string) => {
    if (!userId) return;
    try {
      setDataLoading(true);
      await dbService.deleteRecebimento(id);
      await loadAllUserData(userId);
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir recebimento.');
    } finally {
      setDataLoading(false);
    }
  };

  // Clientes CRUD
  const handleAddCliente = async (nome: string, email?: string, telefone?: string) => {
    if (!userId) throw new Error('Utilizador não autenticado.');
    const added = await dbService.addCliente(userId, nome, email, telefone);
    const updated = await dbService.getClientes(userId);
    setClientes(updated);
    return added;
  };

  const handleDeleteCliente = async (id: string) => {
    if (!userId) return;
    try {
      setDataLoading(true);
      await dbService.deleteCliente(id);
      await loadAllUserData(userId);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir o cliente. Certifique-se de que não há recebimentos ou projetos vinculados.');
    } finally {
      setDataLoading(false);
    }
  };

  // Projetos CRUD
  const handleAddProjeto = async (payload: Omit<Projeto, 'id' | 'userId' | 'createdAt'>) => {
    if (!userId) throw new Error('Utilizador não autenticado.');
    const added = await dbService.addProjeto(userId, payload);
    const updated = await dbService.getProjetos(userId);
    setProjetos(updated);
  };

  const handleAddProjetoQuick = async (
    nome: string,
    clienteId: string,
    clienteNome: string,
    categoria: string,
    valorContratado: number
  ): Promise<Projeto> => {
    if (!userId) throw new Error('Utilizador não autenticado.');
    const payload: Omit<Projeto, 'id' | 'userId' | 'createdAt'> = {
      nome,
      clienteId,
      clienteNome,
      categoria,
      valorContratado,
      dataInicio: new Date().toISOString().split('T')[0],
      status: 'Planejamento'
    };
    const added = await dbService.addProjeto(userId, payload);
    const updated = await dbService.getProjetos(userId);
    setProjetos(updated);
    return added;
  };

  const handleUpdateProjetoStatus = async (id: string, status: StatusProjetoType) => {
    if (!userId) return;
    try {
      await dbService.updateProjeto(id, { status });
      const updated = await dbService.getProjetos(userId);
      setProjetos(updated);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status do projeto.');
    }
  };

  const handleDeleteProjeto = async (id: string) => {
    if (!userId) return;
    try {
      setDataLoading(true);
      await dbService.deleteProjeto(id);
      await loadAllUserData(userId);
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir projeto.');
    } finally {
      setDataLoading(false);
    }
  };

  // Search details navigator
  const handleSelectFromSearch = (tab: TabType, id: string) => {
    setCurrentTab(tab);
    // Detail highlight can be handled by state in sub-components, or simple search
  };

  // --- RENDERING TABS ---
  const renderActiveTab = () => {
    switch (currentTab) {
      case 'Dashboard':
        return (
          <Dashboard
            clientes={clientes}
            projetos={projetos}
            recebimentos={recebimentos}
            onOpenNewRecebimento={() => {
              setEditingRecebimento(undefined);
              setShowRecebimentoForm(true);
            }}
            onNavigateTo={(tab, id) => {
              setCurrentTab(tab as TabType);
            }}
          />
        );
      case 'Recebimentos':
        return (
          <RecebimentosList
            recebimentos={recebimentos}
            clientes={clientes}
            projetos={projetos}
            onAddRecebimento={() => {
              setEditingRecebimento(undefined);
              setShowRecebimentoForm(true);
            }}
            onEditRecebimento={(rec) => {
              setEditingRecebimento(rec);
              setShowRecebimentoForm(true);
            }}
            onDeleteRecebimento={handleDeleteRecebimento}
          />
        );
      case 'Projetos':
        return (
          <ProjetosList
            projetos={projetos}
            clientes={clientes}
            recebimentos={recebimentos}
            onAddProjeto={handleAddProjeto}
            onUpdateProjetoStatus={handleUpdateProjetoStatus}
            onDeleteProjeto={handleDeleteProjeto}
          />
        );
      case 'Clientes':
        return (
          <ClientesList
            clientes={clientes}
            projetos={projetos}
            recebimentos={recebimentos}
            onAddCliente={handleAddCliente}
            onDeleteCliente={handleDeleteCliente}
          />
        );
      case 'Calendario':
        return <CalendarioFinanceiro recebimentos={recebimentos} />;
      case 'Relatorios':
        return (
          <Relatorios
            clientes={clientes}
            projetos={projetos}
            recebimentos={recebimentos}
          />
        );
      case 'Configuracoes':
        return (
          <Configuracoes
            clientes={clientes}
            projetos={projetos}
            recebimentos={recebimentos}
            sidebarGoal={sidebarGoal}
            setSidebarGoal={setSidebarGoal}
            onResetData={handleResetData}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        );
      default:
        return null;
    }
  };

  // Login screen gate
  if (!userId && !authLoading) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Loading indicator for startup
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3 font-semibold">Carregando Suite Hub Finanças...</p>
      </div>
    );
  }

  // Sum current month receipts to calculate progress for "Próxima Meta" widget
  const now = new Date();
  const currentYearStr = now.getFullYear().toString();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const faturamentoMesSidebar = recebimentos
    .filter(r => r.status === 'Recebido' && r.dataRecebimento && r.dataRecebimento.startsWith(`${currentYearStr}-${currentMonthStr}`))
    .reduce((sum, r) => sum + r.valor, 0);

  const sidebarGoalProgress = Math.min(Math.round((faturamentoMesSidebar / sidebarGoal) * 100), 100);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 flex flex-col md:flex-row transition-colors duration-300 select-none pb-24 md:pb-0">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800/80 shrink-0 p-5 justify-between">
        <div className="space-y-6">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 px-1.5 py-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-500/15">
              <TrendingUp size={16} />
            </div>
            <div>
              <span className="font-sans font-black text-gray-900 dark:text-zinc-50 text-sm block leading-none">
                Suite Hub
              </span>
              <span className="text-[10px] text-emerald-500 font-bold tracking-wider uppercase block mt-0.5">
                Finanças
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'Dashboard', label: 'Dashboard', icon: Home },
              { id: 'Recebimentos', label: 'Recebimentos', icon: DollarSign },
              { id: 'Projetos', label: 'Projetos', icon: Briefcase },
              { id: 'Clientes', label: 'Clientes', icon: Users },
              { id: 'Calendario', label: 'Calendário', icon: Calendar },
              { id: 'Relatorios', label: 'Relatórios', icon: BarChart2 },
              { id: 'Configuracoes', label: 'Configurações', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`nav-desktop-${tab.id.toLowerCase()}`}
                  onClick={() => setCurrentTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Próxima Meta Widget */}
          <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Próxima Meta</p>
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-black text-slate-700 dark:text-zinc-300">
                {sidebarGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} / mês
              </p>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{sidebarGoalProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-zinc-700 h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${sidebarGoalProgress}%` }}></div>
            </div>
          </div>
        </div>

        {/* User profile & controls */}
        <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 space-y-3">
          <div className="flex items-center justify-between px-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 font-extrabold flex items-center justify-center text-xs shrink-0">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-gray-900 dark:text-zinc-100 block truncate" title={userName}>
                  {userName}
                </span>
                <span className="text-[9px] text-gray-400 block truncate">
                  Financeiro
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sair da Conta"
              className="p-1.5 text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </div>

          <div className="flex items-center justify-center px-1">
            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          </div>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      <header className="md:hidden bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-850 p-4 shrink-0 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <TrendingUp size={14} />
          </div>
          <span className="font-sans font-extrabold text-gray-950 dark:text-zinc-50 text-sm">
            Suite Hub
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            title="Sair da Conta"
            className="p-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-750 cursor-pointer flex items-center gap-1"
          >
            <LogOut size={13} />
            <span className="text-[10px]">Sair</span>
          </button>
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 overflow-y-auto relative p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Global Loader Indicator if database is syncing */}
        {dataLoading && (
          <div className="absolute top-4 right-4 z-50 bg-white dark:bg-zinc-900 p-2 border border-gray-100 dark:border-zinc-800 rounded-full shadow-lg flex items-center gap-2 px-3 animate-fade-in">
            <Loader2 size={13} className="text-emerald-500 animate-spin" />
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Salvando...</span>
          </div>
        )}

        {/* Global Search and Context layout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="w-full max-w-sm">
            <SearchGlobal
              clientes={clientes}
              projetos={projetos}
              recebimentos={recebimentos}
              onSelectCliente={(id) => handleSelectFromSearch('Clientes', id)}
              onSelectProjeto={(id) => handleSelectFromSearch('Projetos', id)}
              onSelectRecebimento={(id) => handleSelectFromSearch('Recebimentos', id)}
            />
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest bg-white dark:bg-zinc-900 px-3.5 py-1.5 rounded-full border border-gray-50 dark:border-zinc-800/60 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sincronizado</span>
          </div>
        </div>

        {/* Rendering content dynamically */}
        <div className="relative z-10 pb-12">
          {renderActiveTab()}
        </div>

      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-gray-150 dark:border-zinc-800 rounded-2xl p-2 flex justify-around items-center shadow-xl z-40 transition-all duration-300">
        {[
          { id: 'Dashboard', label: 'Home', icon: Home },
          { id: 'Recebimentos', label: '💰', icon: DollarSign },
          { id: 'Projetos', label: '📁', icon: Briefcase },
          { id: 'Clientes', label: '👥', icon: Users },
          { id: 'Relatorios', label: '📊', icon: BarChart2 },
          { id: 'Configuracoes', label: '⚙️', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-mobile-${tab.id.toLowerCase()}`}
              onClick={() => setCurrentTab(tab.id as TabType)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all relative cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10 scale-105'
                  : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
              }`}
              title={tab.id}
            >
              <Icon size={18} />
              <span className="text-[8px] mt-0.5 font-bold hidden xs:block">{tab.id === 'Configuracoes' ? 'Configurações' : tab.id === 'Relatorios' ? 'Relatórios' : tab.id}</span>
            </button>
          );
        })}
      </nav>

      {/* MODAL FORM OVERLAY */}
      {showRecebimentoForm && (
        <RecebimentoForm
          clientes={clientes}
          projetos={projetos}
          onSave={handleSaveRecebimento}
          onAddCliente={handleAddCliente}
          onAddProjeto={handleAddProjetoQuick}
          onClose={() => {
            setShowRecebimentoForm(false);
            setEditingRecebimento(undefined);
          }}
          initialRecebimento={editingRecebimento}
        />
      )}



    </div>
  );
}
