import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  ArrowUpRight,
  Sparkles,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Cliente, Projeto, Recebimento } from '../types';

interface CalendarioFinanceiroProps {
  recebimentos: Recebimento[];
}

export default function CalendarioFinanceiro({ recebimentos }: CalendarioFinanceiroProps) {
  // Current date view in calendar
  // Default to July 2026 since we have scheduled payments in July 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 0-indexed, 6 = July (Julho)

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Move calendar months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Filter pending (A Receber) receipts
  const aReceberList = recebimentos
    .filter(r => r.status === 'A Receber')
    .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista));

  // Filter all receipts for currently viewed month in the grid (whether paid or pending)
  const currentMonthKey = `${currentYear}-${(currentMonth + 1) < 10 ? '0' + (currentMonth + 1) : (currentMonth + 1)}`;
  const monthReceipts = recebimentos.filter(r => r.dataPrevista.startsWith(currentMonthKey));

  // Generate days of the month grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Day of week (0-6)

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: firstDayIndex }, (_, i) => null);

  const gridDays = [...paddingArray, ...daysArray];

  // Selected day detail
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const selectedDateStr = selectedDay
    ? `${currentYear}-${(currentMonth + 1) < 10 ? '0' + (currentMonth + 1) : (currentMonth + 1)}-${selectedDay < 10 ? '0' + selectedDay : selectedDay}`
    : '';

  const selectedDayReceipts = recebimentos.filter(r => r.dataPrevista === selectedDateStr);

  // Sum total expected in current month
  const expectedThisMonth = monthReceipts
    .filter(r => r.status === 'A Receber')
    .reduce((sum, r) => sum + r.valor, 0);

  const receivedThisMonth = monthReceipts
    .filter(r => r.status === 'Recebido')
    .reduce((sum, r) => sum + r.valor, 0);

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-950 dark:text-zinc-50 tracking-tight">Calendário Financeiro</h2>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Visualize as datas de vencimento e planeje seu fluxo de caixa.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold block">Previsto do Mês</span>
            <span className="text-sm font-black text-amber-500">{formatCurrency(expectedThisMonth)}</span>
          </div>
          <div className="text-right border-l border-gray-100 dark:border-zinc-800 pl-4">
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold block">Recebido do Mês</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(receivedThisMonth)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Grid Selector */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm lg:col-span-2">
          
          {/* Calendar Controller */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-50 flex items-center gap-2">
              <CalendarDays size={16} className="text-emerald-500" />
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Titles */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {gridDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square bg-gray-50/20 dark:bg-zinc-900/10 rounded-xl" />;
              }

              const dateStr = `${currentYear}-${(currentMonth + 1) < 10 ? '0' + (currentMonth + 1) : (currentMonth + 1)}-${day < 10 ? '0' + day : day}`;
              const dayReceipts = recebimentos.filter(r => r.dataPrevista === dateStr);
              const hasPending = dayReceipts.some(r => r.status === 'A Receber');
              const hasReceived = dayReceipts.some(r => r.status === 'Recebido');
              const isSelected = selectedDay === day;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-xl text-xs font-semibold flex flex-col justify-between p-1.5 transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-zinc-50 dark:bg-zinc-800/30 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span>{day}</span>
                  
                  {/* Status Dots */}
                  <div className="flex gap-1 justify-center w-full mt-auto">
                    {hasReceived && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                    )}
                    {hasPending && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-ping' : 'bg-amber-400'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Selected Day expected inflows / Timeline */}
        <div className="space-y-4 lg:col-span-1">
          
          {/* Expected inflows on selected day */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="border-b border-gray-50 dark:border-zinc-800 pb-3">
              <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest block">
                FLUXO DE CAIXA DO DIA
              </span>
              <h4 className="text-sm font-black text-gray-950 dark:text-zinc-50 mt-1">
                {selectedDay ? `${selectedDay} de ${monthNames[currentMonth]} de ${currentYear}` : 'Selecione um dia no calendário'}
              </h4>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {selectedDayReceipts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Nenhum faturamento previsto ou pago para este dia.</p>
              ) : (
                selectedDayReceipts.map(r => (
                  <div key={r.id} className="p-3 bg-gray-50/50 dark:bg-zinc-800/40 rounded-xl border border-gray-100/40 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <span className="font-bold text-gray-950 dark:text-zinc-100 block truncate">{r.clienteNome}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">{r.projetoNome}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-black ${r.status === 'Recebido' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                        {formatCurrency(r.valor)}
                      </span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">
                        {r.status === 'Recebido' ? '🟢 Pago' : '🟡 A Receber'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Timeline of Upcoming Recebimentos (A Receber) */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Próximos Valores Previstos
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {aReceberList.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Excelente! Não há contas pendentes de recebimento.</p>
              ) : (
                aReceberList.slice(0, 6).map((r) => {
                  const dParts = r.dataPrevista.split('-');
                  const shortDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}` : r.dataPrevista;

                  return (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-zinc-800/40 last:border-none text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-amber-500 font-mono shrink-0 bg-amber-500/5 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                          {shortDate}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-950 dark:text-zinc-50 block truncate">
                            {r.clienteNome}
                          </span>
                          <span className="text-[9px] text-gray-400 dark:text-zinc-500 block truncate">
                            {r.categoria}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-gray-950 dark:text-zinc-50 shrink-0 ml-2">
                        {formatCurrency(r.valor)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
