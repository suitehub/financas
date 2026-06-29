export interface Cliente {
  id: string;
  userId: string;
  nome: string;
  email?: string;
  telefone?: string;
  createdAt: string;
}

export interface Projeto {
  id: string;
  userId: string;
  nome: string;
  clienteId: string;
  clienteNome: string;
  categoria: string;
  valorContratado: number;
  dataInicio: string;
  status: 'Planejamento' | 'Desenvolvimento' | 'Testes' | 'Entregue' | 'Suporte';
  createdAt: string;
}

export interface Recebimento {
  id: string;
  userId: string;
  clienteId: string;
  clienteNome: string;
  projetoId: string;
  projetoNome: string;
  categoria: string;
  origem: string;
  valor: number;
  dataPrevista: string; // YYYY-MM-DD
  dataRecebimento?: string; // YYYY-MM-DD when paid
  formaPagamento: string;
  status: 'Recebido' | 'A Receber';
  notaFiscal: 'Emitida' | 'Pendente' | 'Não Necessária';
  nfNumero?: string;
  nfDataEmissao?: string;
  observacoes?: string;
  parcelado?: boolean;
  parcelaAtual?: number;
  totalParcelas?: number;
  grupoParcelasId?: string;
  createdAt: string;
}

export type CategoriaType =
  | 'Desenvolvimento'
  | 'Aplicativo'
  | 'Sistema Web'
  | 'Landing Page'
  | 'Mensalidade'
  | 'Manutenção'
  | 'Consultoria'
  | 'Design'
  | 'Outro';

export type OrigemType =
  | '💻 Desenvolvimento sob demanda'
  | '📱 Aplicativos'
  | '🌐 Sistemas Web'
  | '🔄 Assinaturas (SaaS)'
  | '🛠️ Manutenção'
  | '🎨 Design'
  | '📚 Outros';

export type FormaPagamentoType = 'Pix' | 'Cartão' | 'Transferência' | 'Dinheiro' | 'Outro';

export type StatusRecebimentoType = 'Recebido' | 'A Receber';

export type StatusProjetoType = 'Planejamento' | 'Desenvolvimento' | 'Testes' | 'Entregue' | 'Suporte';

export type NotaFiscalType = 'Emitida' | 'Pendente' | 'Não Necessária';
