import React, { useState, useEffect } from 'react';
import { Search, X, User, Briefcase, DollarSign, Calendar } from 'lucide-react';
import { Cliente, Projeto, Recebimento } from '../types';

interface SearchGlobalProps {
  clientes: Cliente[];
  projetos: Projeto[];
  recebimentos: Recebimento[];
  onSelectCliente: (id: string) => void;
  onSelectProjeto: (id: string) => void;
  onSelectRecebimento: (id: string) => void;
}

export default function SearchGlobal({
  clientes,
  projetos,
  recebimentos,
  onSelectCliente,
  onSelectProjeto,
  onSelectRecebimento
}: SearchGlobalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    clientes: Cliente[];
    projetos: Projeto[];
    recebimentos: Recebimento[];
  }>({ clientes: [], projetos: [], recebimentos: [] });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ clientes: [], projetos: [], recebimentos: [] });
      return;
    }

    const q = query.toLowerCase();

    const filteredClientes = clientes.filter(c =>
      c.nome.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.telefone && c.telefone.includes(q))
    );

    const filteredProjetos = projetos.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      p.clienteNome.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q)
    );

    const filteredRecebimentos = recebimentos.filter(r =>
      r.clienteNome.toLowerCase().includes(q) ||
      r.projetoNome.toLowerCase().includes(q) ||
      r.categoria.toLowerCase().includes(q) ||
      r.origem.toLowerCase().includes(q) ||
      r.valor.toString().includes(q) ||
      r.formaPagamento.toLowerCase().includes(q)
    );

    setResults({
      clientes: filteredClientes,
      projetos: filteredProjetos,
      recebimentos: filteredRecebimentos
    });
  }, [query, clientes, projetos, recebimentos]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="relative">
      {/* Search Input Trigger */}
      <div className="relative w-full max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-zinc-500 pointer-events-none">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Pesquisar clientes, projetos ou recebimentos..."
          onClick={() => setIsOpen(true)}
          value={query}
          onChange={(e) => {
            setIsOpen(true);
            setQuery(e.target.value);
          }}
          className="w-full pl-9 pr-8 py-2 bg-gray-100 dark:bg-zinc-900 border border-transparent dark:border-transparent rounded-xl text-sm focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500 text-gray-900 dark:text-zinc-100 placeholder-gray-400 transition-all shadow-inner"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown Results Overlay */}
      {isOpen && query.trim() && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div className="absolute right-0 mt-2 w-full min-w-[320px] max-w-md bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[450px] overflow-y-auto">
            <div className="p-4 border-b border-gray-50 dark:border-zinc-800/80 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/40">
              <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                Resultados da Busca
              </span>
              <button
                onClick={handleClose}
                className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-2 space-y-4">
              {/* Clientes Section */}
              {results.clientes.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={12} /> Clientes ({results.clientes.length})
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.clientes.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSelectCliente(c.id);
                          handleClose();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/10 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all flex items-center justify-between text-gray-700 dark:text-zinc-300 cursor-pointer"
                      >
                        <span className="font-semibold">{c.nome}</span>
                        {c.email && <span className="text-[10px] text-gray-400 dark:text-zinc-500">{c.email}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Projetos Section */}
              {results.projetos.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase size={12} /> Projetos ({results.projetos.length})
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.projetos.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProjeto(p.id);
                          handleClose();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/10 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all flex flex-col gap-0.5 text-gray-700 dark:text-zinc-300 cursor-pointer"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-semibold">{p.nome}</span>
                          <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                            {formatCurrency(p.valorContratado)}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500">Cliente: {p.clienteNome}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recebimentos Section */}
              {results.recebimentos.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={12} /> Recebimentos ({results.recebimentos.length})
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.recebimentos.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          onSelectRecebimento(r.id);
                          handleClose();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/10 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all flex flex-col gap-0.5 text-gray-700 dark:text-zinc-300 cursor-pointer"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-semibold">{r.projetoNome}</span>
                          <span className={`font-bold ${r.status === 'Recebido' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                            {formatCurrency(r.valor)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500">
                          <span>Cliente: {r.clienteNome}</span>
                          <span className="flex items-center gap-1"><Calendar size={10} /> {r.dataPrevista}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.clientes.length === 0 && results.projetos.length === 0 && results.recebimentos.length === 0 && (
                <div className="p-8 text-center text-gray-400 dark:text-zinc-500 text-xs">
                  Nenhum resultado encontrado para "{query}"
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
