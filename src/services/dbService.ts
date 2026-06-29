import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Cliente, Projeto, Recebimento } from '../types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Collection References
const clientesCol = collection(db, 'clientes');
const projetosCol = collection(db, 'projetos');
const recebimentosCol = collection(db, 'recebimentos');

export const dbService = {
  // --- CLIENTES ---
  async getClientes(userId: string): Promise<Cliente[]> {
    try {
      const q = query(clientesCol, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const list: Cliente[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Cliente);
      });
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      console.error("Error fetching Clientes:", error);
      throw error;
    }
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
    await setDoc(doc(db, 'clientes', id), cliente);
    return cliente;
  },

  async updateCliente(id: string, updates: Partial<Omit<Cliente, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, 'clientes', id);
    await updateDoc(docRef, updates);
  },

  async deleteCliente(id: string): Promise<void> {
    await deleteDoc(doc(db, 'clientes', id));
  },

  // --- PROJETOS ---
  async getProjetos(userId: string): Promise<Projeto[]> {
    try {
      const q = query(projetosCol, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const list: Projeto[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Projeto);
      });
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      console.error("Error fetching Projetos:", error);
      throw error;
    }
  },

  async addProjeto(userId: string, projeto: Omit<Projeto, 'id' | 'userId' | 'createdAt'>): Promise<Projeto> {
    const id = generateId();
    const novoProjeto: Projeto = {
      ...projeto,
      id,
      userId,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'projetos', id), novoProjeto);
    return novoProjeto;
  },

  async updateProjeto(id: string, updates: Partial<Omit<Projeto, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, 'projetos', id);
    await updateDoc(docRef, updates);
  },

  async deleteProjeto(id: string): Promise<void> {
    await deleteDoc(doc(db, 'projetos', id));
  },

  // --- RECEBIMENTOS ---
  async getRecebimentos(userId: string): Promise<Recebimento[]> {
    try {
      const q = query(recebimentosCol, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const list: Recebimento[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Recebimento);
      });
      return list.sort((a, b) => b.dataPrevista.localeCompare(a.dataPrevista));
    } catch (error) {
      console.error("Error fetching Recebimentos:", error);
      throw error;
    }
  },

  async addRecebimento(userId: string, recebimento: Omit<Recebimento, 'id' | 'userId' | 'createdAt'>): Promise<Recebimento> {
    const id = generateId();
    const novoRecebimento: Recebimento = {
      ...recebimento,
      id,
      userId,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'recebimentos', id), novoRecebimento);
    return novoRecebimento;
  },

  async updateRecebimento(id: string, updates: Partial<Omit<Recebimento, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, 'recebimentos', id);
    await updateDoc(docRef, updates);
  },

  async deleteRecebimento(id: string): Promise<void> {
    await deleteDoc(doc(db, 'recebimentos', id));
  },

  // --- AUTO SEEDING FOR EMPTY DEMO ACCOUNT ---
  async seedDemoData(userId: string): Promise<{ clientes: Cliente[], projetos: Projeto[], recebimentos: Recebimento[] }> {
    const batch = writeBatch(db);

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

    batch.set(doc(db, 'clientes', c1Id), client1);
    batch.set(doc(db, 'clientes', c2Id), client2);
    batch.set(doc(db, 'clientes', c3Id), client3);
    batch.set(doc(db, 'clientes', c4Id), client4);

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

    batch.set(doc(db, 'projetos', p1Id), proj1);
    batch.set(doc(db, 'projetos', p2Id), proj2);
    batch.set(doc(db, 'projetos', p3Id), proj3);
    batch.set(doc(db, 'projetos', p4Id), proj4);

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

    batch.set(doc(db, 'recebimentos', r1Id), rec1);
    batch.set(doc(db, 'recebimentos', r2Id), rec2);
    batch.set(doc(db, 'recebimentos', r3Id), rec3);
    batch.set(doc(db, 'recebimentos', r4Id), rec4);
    batch.set(doc(db, 'recebimentos', r5Id), rec5);
    batch.set(doc(db, 'recebimentos', r6Id), rec6);
    batch.set(doc(db, 'recebimentos', r7Id), rec7);

    await batch.commit();

    return {
      clientes: [client1, client2, client3, client4],
      projetos: [proj1, proj2, proj3, proj4],
      recebimentos: [rec1, rec2, rec3, rec4, rec5, rec6, rec7]
    };
  }
};
