import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Calendar, HelpCircle, DollarSign } from 'lucide-react';
import { Cliente, Projeto, Recebimento, CategoriaType, OrigemType, FormaPagamentoType, StatusRecebimentoType, NotaFiscalType } from '../types';

interface RecebimentoFormProps {
  clientes: Cliente[];
  projetos: Projeto[];
  onSave: (recebimento: Omit<Recebimento, 'id' | 'userId' | 'createdAt'> | Omit<Recebimento, 'id' | 'userId' | 'createdAt'>[]) => Promise<void>;
  onAddCliente: (nome: string) => Promise<Cliente>;
  onAddProjeto: (nome: string, clienteId: string, clienteNome: string, categoria: string, valor: number) => Promise<Projeto>;
  onClose: () => void;
  initialRecebimento?: Recebimento; // For editing
}

const CATEGORIES: CategoriaType[] = [
  'Desenvolvimento',
  'Aplicativo',
  'Sistema Web',
  'Landing Page',
  'Mensalidade',
  'Manutenção',
  'Consultoria',
  'Design',
  'Outro'
];

const ORIGENS: OrigemType[] = [
  '💻 Desenvolvimento sob demanda',
  '📱 Aplicativos',
  '🌐 Sistemas Web',
  '🔄 Assinaturas (SaaS)',
  '🛠️ Manutenção',
  '🎨 Design',
  '📚 Outros'
];

const PAYMENTS: FormaPagamentoType[] = [
  'Pix',
  'Cartão',
  'Transferência',
  'Dinheiro',
  'Outro'
];

const calculateNextDate = (baseDateStr: string, index: number, frequency: 'Mensal' | 'Quinzenal' | 'Semanal') => {
  const parts = baseDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day, 12, 0, 0); // use midday to prevent timezone shifting
  if (frequency === 'Semanal') {
    date.setDate(date.getDate() + (7 * index));
  } else if (frequency === 'Quinzenal') {
    date.setDate(date.getDate() + (15 * index));
  } else { // Mensal
    date.setMonth(date.getMonth() + index);
  }
  return date.toISOString().split('T')[0];
};

export default function RecebimentoForm({
  clientes,
  projetos,
  onSave,
  onAddCliente,
  onAddProjeto,
  onClose,
  initialRecebimento
}: RecebimentoFormProps) {
  // Fields
  const [clienteId, setClienteId] = useState('');
  const [projetoId, setProjetoId] = useState('');
  const [categoria, setCategoria] = useState<CategoriaType>('Desenvolvimento');
  const [origem, setOrigem] = useState<OrigemType>('💻 Desenvolvimento sob demanda');
  const [valor, setValor] = useState('');
  const [dataPrevista, setDataPrevista] = useState(new Date().toISOString().split('T')[0]);
  const [dataRecebimento, setDataRecebimento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoType>('Pix');
  const [status, setStatus] = useState<StatusRecebimentoType>('A Receber');
  const [notaFiscal, setNotaFiscal] = useState<NotaFiscalType>('Não Necessária');
  const [nfNumero, setNfNumero] = useState('');
  const [nfDataEmissao, setNfDataEmissao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Installment states
  const [parcelado, setParcelado] = useState(false);
  const [numParcelas, setNumParcelas] = useState(3);
  const [intervaloParcelas, setIntervaloParcelas] = useState<'Mensal' | 'Quinzenal' | 'Semanal'>('Mensal');
  const [tipoDivisao, setTipoDivisao] = useState<'dividir' | 'repetir'>('dividir');

  // Inline Quick Add state
  const [isAddingCliente, setIsAddingCliente] = useState(false);
  const [newClienteNome, setNewClienteNome] = useState('');
  const [isAddingProjeto, setIsAddingProjeto] = useState(false);
  const [newProjetoNome, setNewProjetoNome] = useState('');
  const [newProjetoValor, setNewProjetoValor] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate if editing
  useEffect(() => {
    if (initialRecebimento) {
      setClienteId(initialRecebimento.clienteId);
      setProjetoId(initialRecebimento.projetoId);
      setCategoria(initialRecebimento.categoria as CategoriaType);
      setOrigem(initialRecebimento.origem as OrigemType);
      setValor(initialRecebimento.valor.toString());
      setDataPrevista(initialRecebimento.dataPrevista);
      setDataRecebimento(initialRecebimento.dataRecebimento || '');
      setFormaPagamento(initialRecebimento.formaPagamento as FormaPagamentoType);
      setStatus(initialRecebimento.status);
      setNotaFiscal(initialRecebimento.notaFiscal);
      setNfNumero(initialRecebimento.nfNumero || '');
      setNfDataEmissao(initialRecebimento.nfDataEmissao || '');
      setObservacoes(initialRecebimento.observacoes || '');
      setParcelado(initialRecebimento.parcelado || false);
      if (initialRecebimento.totalParcelas) {
        setNumParcelas(initialRecebimento.totalParcelas);
      }
    }
  }, [initialRecebimento]);

  // Adjust status of dataRecebimento when status toggles
  const handleStatusChange = (newStatus: StatusRecebimentoType) => {
    setStatus(newStatus);
    if (newStatus === 'Recebido') {
      if (!dataRecebimento) {
        setDataRecebimento(new Date().toISOString().split('T')[0]);
      }
    } else {
      setDataRecebimento('');
    }
  };

  const handleQuickAddCliente = async () => {
    if (!newClienteNome.trim()) return;
    try {
      setLoading(true);
      const added = await onAddCliente(newClienteNome.trim());
      setClienteId(added.id);
      setNewClienteNome('');
      setIsAddingCliente(false);
    } catch (err: any) {
      setError('Erro ao cadastrar cliente rápido: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddProjeto = async () => {
    if (!newProjetoNome.trim()) return;
    if (!clienteId) {
      setError('Selecione ou crie um cliente primeiro.');
      return;
    }
    try {
      setLoading(true);
      const selCliente = clientes.find(c => c.id === clienteId);
      if (!selCliente) return;

      const v = parseFloat(newProjetoValor) || 0;
      const added = await onAddProjeto(
        newProjetoNome.trim(),
        clienteId,
        selCliente.nome,
        categoria,
        v
      );
      setProjetoId(added.id);
      if (v > 0 && !valor) {
        setValor(v.toString());
      }
      setNewProjetoNome('');
      setNewProjetoValor('');
      setIsAddingProjeto(false);
    } catch (err: any) {
      setError('Erro ao cadastrar projeto rápido: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects by selected client
  const filteredProjetos = projetos.filter(p => p.clienteId === clienteId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clienteId) {
      setError('Por favor, selecione um cliente.');
      return;
    }
    if (!projetoId) {
      setError('Por favor, selecione um projeto.');
      return;
    }
    if (!valor || parseFloat(valor) <= 0) {
      setError('Por favor, insira um valor válido.');
      return;
    }

    try {
      setLoading(true);
      const selCliente = clientes.find(c => c.id === clienteId);
      const selProjeto = projetos.find(p => p.id === projetoId);

      if (!selCliente || !selProjeto) {
        throw new Error('Cliente ou Projeto selecionado inválido.');
      }

      let payloads: Omit<Recebimento, 'id' | 'userId' | 'createdAt'> | Omit<Recebimento, 'id' | 'userId' | 'createdAt'>[];

      if (parcelado && !initialRecebimento) {
        const total = parseInt(numParcelas.toString()) || 2;
        const baseVal = parseFloat(valor);
        const grupoId = Math.random().toString(36).substring(2, 15);
        const generatedPayloads: Omit<Recebimento, 'id' | 'userId' | 'createdAt'>[] = [];

        for (let i = 0; i < total; i++) {
          let installmentVal = baseVal;
          if (tipoDivisao === 'dividir') {
            const tempVal = parseFloat((baseVal / total).toFixed(2));
            if (i === 0) {
              const diff = baseVal - (tempVal * total);
              installmentVal = parseFloat((tempVal + diff).toFixed(2));
            } else {
              installmentVal = tempVal;
            }
          }

          const scheduledDate = calculateNextDate(dataPrevista, i, intervaloParcelas);
          const currentStatus = i === 0 ? status : 'A Receber';
          const paidDate = currentStatus === 'Recebido' ? (dataRecebimento || new Date().toISOString().split('T')[0]) : undefined;

          const partInfo = `[Parcela ${i + 1} de ${total}]`;
          const installObs = observacoes.trim()
            ? `${partInfo} - ${observacoes.trim()}`
            : `${partInfo} de ${selProjeto.nome}`;

          generatedPayloads.push({
            clienteId,
            clienteNome: selCliente.nome,
            projetoId,
            projetoNome: selProjeto.nome,
            categoria,
            origem,
            valor: installmentVal,
            dataPrevista: scheduledDate,
            dataRecebimento: paidDate,
            formaPagamento,
            status: currentStatus,
            notaFiscal,
            nfNumero: (notaFiscal === 'Emitida' && i === 0) ? nfNumero : undefined,
            nfDataEmissao: (notaFiscal === 'Emitida' && i === 0) ? nfDataEmissao : undefined,
            observacoes: installObs,
            parcelado: true,
            parcelaAtual: i + 1,
            totalParcelas: total,
            grupoParcelasId: grupoId
          });
        }
        payloads = generatedPayloads;
      } else {
        payloads = {
          clienteId,
          clienteNome: selCliente.nome,
          projetoId,
          projetoNome: selProjeto.nome,
          categoria,
          origem,
          valor: parseFloat(valor),
          dataPrevista,
          dataRecebimento: status === 'Recebido' ? (dataRecebimento || new Date().toISOString().split('T')[0]) : undefined,
          formaPagamento,
          status,
          notaFiscal,
          nfNumero: notaFiscal === 'Emitida' ? nfNumero : undefined,
          nfDataEmissao: notaFiscal === 'Emitida' ? nfDataEmissao : undefined,
          observacoes: observacoes.trim() || undefined,
          parcelado: initialRecebimento?.parcelado || false,
          parcelaAtual: initialRecebimento?.parcelaAtual,
          totalParcelas: initialRecebimento?.totalParcelas,
          grupoParcelasId: initialRecebimento?.grupoParcelasId
        };
      }

      await onSave(payloads);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o recebimento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-zinc-900/30">
          <div>
            <h2 id="recebimento-form-title" className="text-xl font-bold text-gray-950 dark:text-zinc-50">
              {initialRecebimento ? 'Editar Recebimento' : 'Novo Recebimento'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Registre faturamentos e acompanhe entradas em menos de 20 segundos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Cliente & Projeto Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente Select */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider ml-1">
                    Cliente
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCliente(!isAddingCliente)}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> {isAddingCliente ? 'Cancelar' : 'Novo'}
                  </button>
                </div>

                {isAddingCliente ? (
                  <div className="flex gap-2 bg-gray-50 dark:bg-zinc-800/40 p-2 rounded-xl border border-gray-100 dark:border-zinc-800/80">
                    <input
                      type="text"
                      placeholder="Nome do Cliente..."
                      value={newClienteNome}
                      onChange={(e) => setNewClienteNome(e.target.value)}
                      className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddCliente}
                      className="px-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all text-xs font-semibold cursor-pointer flex items-center justify-center"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <select
                    required
                    value={clienteId}
                    onChange={(e) => {
                      setClienteId(e.target.value);
                      setProjetoId(''); // Reset project on client change
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="">Selecione o Cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Projeto Select */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider ml-1">
                    Projeto
                  </label>
                  <button
                    type="button"
                    disabled={!clienteId}
                    onClick={() => setIsAddingProjeto(!isAddingProjeto)}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Plus size={12} /> {isAddingProjeto ? 'Cancelar' : 'Novo'}
                  </button>
                </div>

                {isAddingProjeto ? (
                  <div className="flex flex-col gap-2 bg-gray-50 dark:bg-zinc-800/40 p-2 rounded-xl border border-gray-100 dark:border-zinc-800/80">
                    <input
                      type="text"
                      placeholder="Nome do Projeto..."
                      value={newProjetoNome}
                      onChange={(e) => setNewProjetoNome(e.target.value)}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Valor Contratado R$..."
                        value={newProjetoValor}
                        onChange={(e) => setNewProjetoValor(e.target.value)}
                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddProjeto}
                        className="px-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all text-xs font-semibold cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    required
                    disabled={!clienteId}
                    value={projetoId}
                    onChange={(e) => {
                      setProjetoId(e.target.value);
                      const selectedProj = projetos.find(p => p.id === e.target.value);
                      if (selectedProj) {
                        setCategoria(selectedProj.categoria as CategoriaType);
                        setValor(selectedProj.valorContratado.toString());
                      }
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{clienteId ? 'Selecione o Projeto' : 'Selecione o Cliente Primeiro'}</option>
                    {filteredProjetos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Categoria & Origem Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider ml-1">
                  Categoria
                </label>
                <select
                  required
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaType)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider ml-1">
                  Origem do Faturamento
                </label>
                <select
                  required
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value as OrigemType)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                >
                  {ORIGENS.map((ori) => (
                    <option key={ori} value={ori}>{ori}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Valor & Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider ml-1">
                  Valor (R$)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 font-medium text-xs">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 transition-all placeholder-zinc-400 font-medium"
                  />
                </div>
              </div>

              {/* Status Recebimento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider ml-1">
                  Status de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-100/80 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200/40 dark:border-zinc-700/30">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Recebido')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      status === 'Recebido'
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                        : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white block" />
                    Recebido
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('A Receber')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      status === 'A Receber'
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/10'
                        : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white block animate-pulse" />
                    A Receber
                  </button>
                </div>
              </div>
            </div>

            {/* Installment Toggle Section */}
            {!initialRecebimento ? (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                      Faturamento Parcelado?
                    </label>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                      Gere múltiplas parcelas automaticamente a partir deste lançamento.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParcelado(!parcelado)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      parcelado ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 left-1 transition-transform ${
                        parcelado ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                {parcelado && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-250 dark:border-zinc-800/60 animate-fade-in">
                    {/* Quantidade */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                        Nº de Parcelas
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="72"
                        required={parcelado}
                        value={numParcelas}
                        onChange={(e) => setNumParcelas(Math.max(2, parseInt(e.target.value) || 2))}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Frequência */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                        Periodicidade
                      </label>
                      <select
                        value={intervaloParcelas}
                        onChange={(e) => setIntervaloParcelas(e.target.value as 'Mensal' | 'Quinzenal' | 'Semanal')}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="Mensal">Mensal</option>
                        <option value="Quinzenal">Quinzenal</option>
                        <option value="Semanal">Semanal</option>
                      </select>
                    </div>

                    {/* Tipo Divisão */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                        Como dividir o valor?
                      </label>
                      <select
                        value={tipoDivisao}
                        onChange={(e) => setTipoDivisao(e.target.value as 'dividir' | 'repetir')}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="dividir">Dividir igualmente</option>
                        <option value="repetir">Repetir valor cheio</option>
                      </select>
                    </div>

                    {/* Helper preview info */}
                    <div className="col-span-1 sm:col-span-3 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 p-2.5 rounded-xl mt-1">
                      {tipoDivisao === 'dividir' ? (
                        <span>
                          Serão criadas <strong>{numParcelas} parcelas</strong>. A 1ª parcela será de{' '}
                          <strong>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              parseFloat((parseFloat(valor || '0') / numParcelas).toFixed(2)) +
                                parseFloat(
                                  (
                                    parseFloat(valor || '0') -
                                    parseFloat((parseFloat(valor || '0') / numParcelas).toFixed(2)) * numParcelas
                                  ).toFixed(2)
                                )
                            )}
                          </strong>{' '}
                          e as demais de{' '}
                          <strong>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              parseFloat((parseFloat(valor || '0') / numParcelas).toFixed(2))
                            )}
                          </strong>.
                        </span>
                      ) : (
                        <span>
                          Serão criadas <strong>{numParcelas} parcelas</strong> de{' '}
                          <strong>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              parseFloat(valor || '0')
                            )}
                          </strong>{' '}
                          cada. Valor total do plano:{' '}
                          <strong>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              parseFloat(valor || '0') * numParcelas
                            )}
                          </strong>.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : initialRecebimento?.parcelado ? (
              <div className="p-3.5 bg-sky-50 dark:bg-sky-950/15 border border-sky-100 dark:border-sky-900/30 text-sky-700 dark:text-sky-400 text-xs rounded-2xl flex items-center justify-between">
                <span className="font-semibold">Este faturamento faz parte de um parcelamento</span>
                <span className="bg-sky-500/10 text-sky-600 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  Parcela {initialRecebimento.parcelaAtual} de {initialRecebimento.totalParcelas}
                </span>
              </div>
            ) : null}

            {/* Datas & Forma Pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider ml-1">
                  Previsão de Recebimento
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 pointer-events-none">
                    <Calendar size={15} />
                  </span>
                  <input
                    type="date"
                    required
                    value={dataPrevista}
                    onChange={(e) => setDataPrevista(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                  Data do Pagamento {status === 'A Receber' && <span className="text-[10px] text-zinc-400 font-normal">(Inativo)</span>}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 pointer-events-none">
                    <Calendar size={15} />
                  </span>
                  <input
                    type="date"
                    disabled={status === 'A Receber'}
                    value={dataRecebimento}
                    onChange={(e) => setDataRecebimento(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider ml-1">
                  Forma de Pagamento
                </label>
                <select
                  required
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value as FormaPagamentoType)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                >
                  {PAYMENTS.map((pm) => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nota Fiscal Configuration */}
            <div className="p-4 bg-gray-50/50 dark:bg-zinc-900/20 border border-gray-100 dark:border-zinc-800/60 rounded-2xl space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                  Nota Fiscal (NF)
                </label>
                <div className="grid grid-cols-3 gap-2 bg-zinc-100/50 dark:bg-zinc-800/30 p-1 rounded-xl">
                  {(['Emitida', 'Pendente', 'Não Necessária'] as NotaFiscalType[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setNotaFiscal(opt)}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        notaFiscal === opt
                          ? 'bg-emerald-500 dark:bg-emerald-600 text-white'
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                      }`}
                    >
                      {opt === 'Não Necessária' ? 'Não Precisa' : opt}
                    </button>
                  ))}
                </div>
              </div>

              {notaFiscal === 'Emitida' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                      Número da Nota Fiscal
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: NF-1024"
                      value={nfNumero}
                      onChange={(e) => setNfNumero(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                      Data de Emissão da NF
                    </label>
                    <input
                      type="date"
                      value={nfDataEmissao}
                      onChange={(e) => setNfDataEmissao(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider ml-1">
                Observações (Opcional)
              </label>
              <textarea
                placeholder="Insira detalhes adicionais do faturamento aqui..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none transition-all"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 font-semibold text-sm transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/10 flex items-center gap-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={16} />
                    {initialRecebimento ? 'Salvar Alterações' : 'Salvar Recebimento'}
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
