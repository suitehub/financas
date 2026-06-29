import { Cliente, Projeto, Recebimento } from '../types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper keys
const CLIENTES_KEY = 'suitehub_clientes';
const PROJETOS_KEY = 'suitehub_projetos';
const RECEBIMENTOS_KEY = 'suitehub_recebimentos';

// Helper storage load/save
const getLocalData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveLocalData = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const dbService = {
  // --- CLIENTES ---
  async getClientes(userId: string): Promise<Cliente[]> {
    const list = getLocalData<Cliente>(CLIENTES_KEY);
    return list
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async addCliente(userId: string, nome: string, email = '', telefone = ''): Promise<Cliente> {
    const id = generateId();
    const cliente: Cliente = {
      id,
      userId,
      nome,
      email,
      telefone,
      createdAt: new Date().toISOString()
    };
    const list = getLocalData<Cliente>(CLIENTES_KEY);
    list.push(cliente);
    saveLocalData(CLIENTES_KEY, list);
    return cliente;
  },

  async updateCliente(id: string, updates: Partial<Omit<Cliente, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const list = getLocalData<Cliente>(CLIENTES_KEY);
    const index = list.findIndex((item) => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      saveLocalData(CLIENTES_KEY, list);
    }
  },

  async deleteCliente(id: string): Promise<void> {
    const list = getLocalData<Cliente>(CLIENTES_KEY);
    const filtered = list.filter((item) => item.id !== id);
    saveLocalData(CLIENTES_KEY, filtered);
  },

  // --- PROJETOS ---
  async getProjetos(userId: string): Promise<Projeto[]> {
    const list = getLocalData<Projeto>(PROJETOS_KEY);
    return list
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async addProjeto(userId: string, projeto: Omit<Projeto, 'id' | 'userId' | 'createdAt'>): Promise<Projeto> {
    const id = generateId();
    const novoProjeto: Projeto = {
      ...projeto,
      id,
      userId,
      createdAt: new Date().toISOString()
    };
    const list = getLocalData<Projeto>(PROJETOS_KEY);
    list.push(novoProjeto);
    saveLocalData(PROJETOS_KEY, list);
    return novoProjeto;
  },

  async updateProjeto(id: string, updates: Partial<Omit<Projeto, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const list = getLocalData<Projeto>(PROJETOS_KEY);
    const index = list.findIndex((item) => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      saveLocalData(PROJETOS_KEY, list);
    }
  },

  async deleteProjeto(id: string): Promise<void> {
    const list = getLocalData<Projeto>(PROJETOS_KEY);
    const filtered = list.filter((item) => item.id !== id);
    saveLocalData(PROJETOS_KEY, filtered);
  },

  // --- RECEBIMENTOS ---
  async getRecebimentos(userId: string): Promise<Recebimento[]> {
    const list = getLocalData<Recebimento>(RECEBIMENTOS_KEY);
    return list
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.dataPrevista.localeCompare(a.dataPrevista));
  },

  async addRecebimento(userId: string, recebimento: Omit<Recebimento, 'id' | 'userId' | 'createdAt'>): Promise<Recebimento> {
    const id = generateId();
    const novoRecebimento: Recebimento = {
      ...recebimento,
      id,
      userId,
      createdAt: new Date().toISOString()
    };
    const list = getLocalData<Recebimento>(RECEBIMENTOS_KEY);
    list.push(novoRecebimento);
    saveLocalData(RECEBIMENTOS_KEY, list);
    return novoRecebimento;
  },

  async updateRecebimento(id: string, updates: Partial<Omit<Recebimento, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const list = getLocalData<Recebimento>(RECEBIMENTOS_KEY);
    const index = list.findIndex((item) => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      saveLocalData(RECEBIMENTOS_KEY, list);
    }
  },

  async deleteRecebimento(id: string): Promise<void> {
    const list = getLocalData<Recebimento>(RECEBIMENTOS_KEY);
    const filtered = list.filter((item) => item.id !== id);
    saveLocalData(RECEBIMENTOS_KEY, filtered);
  },

  // --- AUTO SEEDING FOR EMPTY DEMO ACCOUNT ---
  async seedDemoData(userId: string): Promise<{ clientes: Cliente[], projetos: Projeto[], recebimentos: Recebimento[] }> {
    const dateOffset = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    // 1. Seed Clientes
    const c1Id = 'demo-c1';
    const c2Id = 'demo-c2';
    const c3Id = 'demo-c3';
    const c4Id = 'demo-c4';

    const client1: Cliente = { id: c1Id, userId, nome: 'Clínica ABC Médica', email: 'contato@clinicaabc.com.br', telefone: '(11) 98888-7777', createdAt: dateOffset(-45) };
    const client2: Cliente = { id: c2Id, userId, nome: 'TechVibe Creative Studio', email: 'hello@techvibe.design', telefone: '(21) 97777-6666', createdAt: dateOffset(-30) };
    const client3: Cliente = { id: c3Id, userId, nome: 'Padaria Bella Massa', email: 'financeiro@bellamassa.com', telefone: '(31) 96666-5555', createdAt: dateOffset(-20) };
    const client4: Cliente = { id: c4Id, userId, nome: 'Alura Corp Inc', email: 'parcerias@aluracorp.com', telefone: '(11) 95555-4444', createdAt: dateOffset(-10) };

    const clientes = [client1, client2, client3, client4];

    // 2. Seed Projetos
    const p1Id = 'demo-p1';
    const p2Id = 'demo-p2';
    const p3Id = 'demo-p3';
    const p4Id = 'demo-p4';

    const proj1: Projeto = {
      id: p1Id,
      userId,
      nome: 'Sistema de Prontuários',
      clienteId: c1Id,
      clienteNome: 'Clínica ABC Médica',
      categoria: 'Sistema Web',
      valorContratado: 12000,
      dataInicio: dateOffset(-40),
      status: 'Desenvolvimento',
      createdAt: dateOffset(-40)
    };

    const proj2: Projeto = {
      id: p2Id,
      userId,
      nome: 'Landing Page Pro',
      clienteId: c2Id,
      clienteNome: 'TechVibe Creative Studio',
      categoria: 'Landing Page',
      valorContratado: 3500,
      dataInicio: dateOffset(-28),
      status: 'Entregue',
      createdAt: dateOffset(-28)
    };

    const proj3: Projeto = {
      id: p3Id,
      userId,
      nome: 'Aplicativo Delivery iOS/Android',
      clienteId: c3Id,
      clienteNome: 'Padaria Bella Massa',
      categoria: 'Aplicativo',
      valorContratado: 8000,
      dataInicio: dateOffset(-18),
      status: 'Testes',
      createdAt: dateOffset(-18)
    };

    const proj4: Projeto = {
      id: p4Id,
      userId,
      nome: 'Consultoria Mensal TI',
      clienteId: c4Id,
      clienteNome: 'Alura Corp Inc',
      categoria: 'Consultoria',
      valorContratado: 15000,
      dataInicio: dateOffset(-8),
      status: 'Suporte',
      createdAt: dateOffset(-8)
    };

    const projetos = [proj1, proj2, proj3, proj4];

    // 3. Seed Recebimentos
    const r1Id = 'demo-r1';
    const r2Id = 'demo-r2';
    const r3Id = 'demo-r3';
    const r4Id = 'demo-r4';
    const r5Id = 'demo-r5';
    const r6Id = 'demo-r6';
    const r7Id = 'demo-r7';

    const rec1: Recebimento = {
      id: r1Id,
      userId,
      clienteId: c1Id,
      clienteNome: 'Clínica ABC Médica',
      projetoId: p1Id,
      projetoNome: 'Sistema de Prontuários',
      categoria: 'Sistema Web',
      origem: '🌐 Sistemas Web',
      valor: 4000,
      dataPrevista: dateOffset(-15),
      dataRecebimento: dateOffset(-14),
      formaPagamento: 'Pix',
      status: 'Recebido',
      notaFiscal: 'Emitida',
      nfNumero: 'NF-1024',
      nfDataEmissao: dateOffset(-14),
      observacoes: 'Primeira parcela de desenvolvimento',
      createdAt: dateOffset(-15)
    };

    const rec2: Recebimento = {
      id: r2Id,
      userId,
      clienteId: c1Id,
      clienteNome: 'Clínica ABC Médica',
      projetoId: p1Id,
      projetoNome: 'Sistema de Prontuários',
      categoria: 'Sistema Web',
      origem: '🌐 Sistemas Web',
      valor: 4000,
      dataPrevista: dateOffset(15),
      formaPagamento: 'Pix',
      status: 'A Receber',
      notaFiscal: 'Pendente',
      observacoes: 'Segunda parcela do projeto prevista para entrega da homologação',
      createdAt: dateOffset(-15)
    };

    const rec3: Recebimento = {
      id: r3Id,
      userId,
      clienteId: c2Id,
      clienteNome: 'TechVibe Creative Studio',
      projetoId: p2Id,
      projetoNome: 'Landing Page Pro',
      categoria: 'Landing Page',
      origem: '🎨 Design',
      valor: 3500,
      dataPrevista: dateOffset(-5),
      dataRecebimento: dateOffset(-5),
      formaPagamento: 'Transferência',
      status: 'Recebido',
      notaFiscal: 'Não Necessária',
      observacoes: 'Pagamento único integral',
      createdAt: dateOffset(-5)
    };

    const rec4: Recebimento = {
      id: r4Id,
      userId,
      clienteId: c3Id,
      clienteNome: 'Padaria Bella Massa',
      projetoId: p3Id,
      projetoNome: 'Aplicativo Delivery iOS/Android',
      categoria: 'Aplicativo',
      origem: '📱 Aplicativos',
      valor: 4000,
      dataPrevista: dateOffset(-2),
      dataRecebimento: dateOffset(-1),
      formaPagamento: 'Cartão',
      status: 'Recebido',
      notaFiscal: 'Emitida',
      nfNumero: 'NF-1025',
      nfDataEmissao: dateOffset(-1),
      observacoes: 'Entrada de 50% para início',
      createdAt: dateOffset(-2)
    };

    const rec5: Recebimento = {
      id: r5Id,
      userId,
      clienteId: c3Id,
      clienteNome: 'Padaria Bella Massa',
      projetoId: p3Id,
      projetoNome: 'Aplicativo Delivery iOS/Android',
      categoria: 'Aplicativo',
      origem: '📱 Aplicativos',
      valor: 4000,
      dataPrevista: dateOffset(20),
      formaPagamento: 'Cartão',
      status: 'A Receber',
      notaFiscal: 'Pendente',
      observacoes: 'Entrega final nas lojas de aplicativos',
      createdAt: dateOffset(-2)
    };

    const rec6: Recebimento = {
      id: r6Id,
      userId,
      clienteId: c4Id,
      clienteNome: 'Alura Corp Inc',
      projetoId: p4Id,
      projetoNome: 'Consultoria Mensal TI',
      categoria: 'Consultoria',
      origem: '🛠️ Manutenção',
      valor: 1250,
      dataPrevista: dateOffset(-1),
      dataRecebimento: dateOffset(-1),
      formaPagamento: 'Pix',
      status: 'Recebido',
      notaFiscal: 'Emitida',
      nfNumero: 'NF-1026',
      nfDataEmissao: dateOffset(-1),
      observacoes: 'Mensalidade de consultoria Referente a Junho/2026',
      createdAt: dateOffset(-1)
    };

    const rec7: Recebimento = {
      id: r7Id,
      userId,
      clienteId: c4Id,
      clienteNome: 'Alura Corp Inc',
      projetoId: p4Id,
      projetoNome: 'Consultoria Mensal TI',
      categoria: 'Consultoria',
      origem: '🛠️ Manutenção',
      valor: 1250,
      dataPrevista: dateOffset(29), // scheduled for next month
      formaPagamento: 'Pix',
      status: 'A Receber',
      notaFiscal: 'Pendente',
      observacoes: 'Mensalidade de consultoria Referente a Julho/2026',
      createdAt: dateOffset(-1)
    };

    const recebimentos = [rec1, rec2, rec3, rec4, rec5, rec6, rec7];

    // Overwrite with initial seeded data
    saveLocalData(CLIENTES_KEY, clientes);
    saveLocalData(PROJETOS_KEY, projetos);
    saveLocalData(RECEBIMENTOS_KEY, recebimentos);

    return { clientes, projetos, recebimentos };
  }
};
