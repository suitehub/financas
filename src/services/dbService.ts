import { Cliente, Projeto, Recebimento, Usuario } from '../types';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

// Helper to generate unique IDs
const generateId = () => 'id_' + Math.random().toString(36).substring(2, 11);

// Helper to sanitize undefined values before saving to Firestore
const cleanData = <T extends Record<string, any>>(obj: T): T => {
  const cleaned = {} as any;
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
};

// Local storage caching helpers
const getLocal = <T>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLocal = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving local cache:', e);
  }
};

export const dbService = {
  // --- USUARIOS ---
  async getUsuario(userId: string): Promise<Usuario | null> {
    const cacheKey = `suitehub_user_${userId}`;
    try {
      const userDocRef = doc(db, 'usuarios', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const u = docSnap.data() as Usuario;
        localStorage.setItem(cacheKey, JSON.stringify(u));
        return u;
      }
    } catch (e) {
      console.warn('Firestore getUsuario notice:', e);
    }
    
    // Fallback to local
    try {
      const local = localStorage.getItem(cacheKey);
      if (local) return JSON.parse(local);
    } catch {}
    return null;
  },

  async updateUsuario(userId: string, updates: Partial<Usuario>): Promise<void> {
    const cacheKey = `suitehub_user_${userId}`;
    try {
      const local = localStorage.getItem(cacheKey);
      if (local) {
        const parsed = JSON.parse(local);
        localStorage.setItem(cacheKey, JSON.stringify({ ...parsed, ...updates }));
      }
    } catch {}

    try {
      const userDocRef = doc(db, 'usuarios', userId);
      await updateDoc(userDocRef, cleanData(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `usuarios/${userId}`);
    }
  },

  async syncUsuario(userId: string, email: string, nome: string): Promise<Usuario> {
    const path = `usuarios/${userId}`;
    const userDocRef = doc(db, 'usuarios', userId);
    const now = new Date().toISOString();
    const cacheKey = `suitehub_user_${userId}`;
    
    let user: Usuario = {
      id: userId,
      email: email,
      nome: nome || email.split('@')[0] || 'Usuário',
      createdAt: now,
      lastLogin: now
    };

    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        user = {
          id: userId,
          email: email || existingData.email || '',
          nome: nome || existingData.nome || 'Usuário',
          createdAt: existingData.createdAt || now,
          lastLogin: now,
          demoSeeded: existingData.demoSeeded
        };
        await updateDoc(userDocRef, {
          nome: user.nome,
          lastLogin: user.lastLogin
        }).catch(() => {});
      } else {
        await setDoc(userDocRef, cleanData(user)).catch(() => {});
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }

    localStorage.setItem(cacheKey, JSON.stringify(user));
    return user;
  },

  // --- CLIENTES ---
  async getClientes(userId: string): Promise<Cliente[]> {
    const cacheKey = `suitehub_clientes_${userId}`;
    const path = 'clientes';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const list: Cliente[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Cliente);
      });
      if (list.length > 0) {
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setLocal(cacheKey, list);
        return list;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }

    // Fallback to cache
    const cached = getLocal<Cliente>(cacheKey);
    return cached.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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
    
    // Update local cache
    const cacheKey = `suitehub_clientes_${userId}`;
    const current = getLocal<Cliente>(cacheKey);
    setLocal(cacheKey, [cliente, ...current]);

    // Update Firestore
    try {
      await setDoc(doc(db, 'clientes', id), cleanData(cliente));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `clientes/${id}`);
    }
    return cliente;
  },

  async updateCliente(id: string, updates: Partial<Omit<Cliente, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    // Update local caches
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('suitehub_clientes_')) {
        const list = getLocal<Cliente>(k);
        const idx = list.findIndex(c => c.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          setLocal(k, list);
        }
      }
    }

    try {
      await updateDoc(doc(db, 'clientes', id), cleanData(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clientes/${id}`);
    }
  },

  async deleteCliente(id: string): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('suitehub_clientes_')) {
        const list = getLocal<Cliente>(k);
        const filtered = list.filter(c => c.id !== id);
        setLocal(k, filtered);
      }
    }

    try {
      await deleteDoc(doc(db, 'clientes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clientes/${id}`);
    }
  },

  // --- PROJETOS ---
  async getProjetos(userId: string): Promise<Projeto[]> {
    const cacheKey = `suitehub_projetos_${userId}`;
    const path = 'projetos';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const list: Projeto[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Projeto);
      });
      if (list.length > 0) {
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setLocal(cacheKey, list);
        return list;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }

    const cached = getLocal<Projeto>(cacheKey);
    return cached.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  async addProjeto(userId: string, projeto: Omit<Projeto, 'id' | 'userId' | 'createdAt'>): Promise<Projeto> {
    const id = generateId();
    const novoProjeto: Projeto = {
      ...projeto,
      id,
      userId,
      createdAt: new Date().toISOString()
    };

    const cacheKey = `suitehub_projetos_${userId}`;
    const current = getLocal<Projeto>(cacheKey);
    setLocal(cacheKey, [novoProjeto, ...current]);

    try {
      await setDoc(doc(db, 'projetos', id), cleanData(novoProjeto));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projetos/${id}`);
    }
    return novoProjeto;
  },

  async updateProjeto(id: string, updates: Partial<Omit<Projeto, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('suitehub_projetos_')) {
        const list = getLocal<Projeto>(k);
        const idx = list.findIndex(p => p.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          setLocal(k, list);
        }
      }
    }

    try {
      await updateDoc(doc(db, 'projetos', id), cleanData(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projetos/${id}`);
    }
  },

  async deleteProjeto(id: string): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('suitehub_projetos_')) {
        const list = getLocal<Projeto>(k);
        setLocal(k, list.filter(p => p.id !== id));
      }
    }

    try {
      await deleteDoc(doc(db, 'projetos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projetos/${id}`);
    }
  },

  // --- RECEBIMENTOS ---
  async getRecebimentos(userId: string): Promise<Recebimento[]> {
    const cacheKey = `suitehub_recebimentos_${userId}`;
    const path = 'recebimentos';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const list: Recebimento[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Recebimento);
      });
      if (list.length > 0) {
        list.sort((a, b) => b.dataPrevista.localeCompare(a.dataPrevista));
        setLocal(cacheKey, list);
        return list;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }

    const cached = getLocal<Recebimento>(cacheKey);
    return cached.sort((a, b) => (b.dataPrevista || '').localeCompare(a.dataPrevista || ''));
  },

  async addRecebimento(userId: string, recebimento: Omit<Recebimento, 'id' | 'userId' | 'createdAt'>): Promise<Recebimento> {
    const id = generateId();
    const novoRecebimento: Recebimento = {
      ...recebimento,
      id,
      userId,
      createdAt: new Date().toISOString()
    };

    const cacheKey = `suitehub_recebimentos_${userId}`;
    const current = getLocal<Recebimento>(cacheKey);
    setLocal(cacheKey, [novoRecebimento, ...current]);

    try {
      await setDoc(doc(db, 'recebimentos', id), cleanData(novoRecebimento));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `recebimentos/${id}`);
    }
    return novoRecebimento;
  },

  async updateRecebimento(id: string, updates: Partial<Omit<Recebimento, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('suitehub_recebimentos_')) {
        const list = getLocal<Recebimento>(k);
        const idx = list.findIndex(r => r.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          setLocal(k, list);
        }
      }
    }

    try {
      await updateDoc(doc(db, 'recebimentos', id), cleanData(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `recebimentos/${id}`);
    }
  },

  async deleteRecebimento(id: string): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('suitehub_recebimentos_')) {
        const list = getLocal<Recebimento>(k);
        setLocal(k, list.filter(r => r.id !== id));
      }
    }

    try {
      await deleteDoc(doc(db, 'recebimentos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recebimentos/${id}`);
    }
  },

  // --- AUTO SEEDING FOR EMPTY DEMO ACCOUNT ---
  async seedDemoData(userId: string): Promise<{ clientes: Cliente[], projetos: Projeto[], recebimentos: Recebimento[] }> {
    const dateOffset = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    // 1. Seed Clientes
    const c1Id = `demo_c1_${userId}`;
    const c2Id = `demo_c2_${userId}`;
    const c3Id = `demo_c3_${userId}`;
    const c4Id = `demo_c4_${userId}`;

    const client1: Cliente = { id: c1Id, userId, nome: 'Clínica ABC Médica', email: 'contato@clinicaabc.com.br', telefone: '(11) 98888-7777', createdAt: dateOffset(-45) };
    const client2: Cliente = { id: c2Id, userId, nome: 'TechVibe Creative Studio', email: 'hello@techvibe.design', telefone: '(21) 97777-6666', createdAt: dateOffset(-30) };
    const client3: Cliente = { id: c3Id, userId, nome: 'Padaria Bella Massa', email: 'financeiro@bellamassa.com', telefone: '(31) 96666-5555', createdAt: dateOffset(-20) };
    const client4: Cliente = { id: c4Id, userId, nome: 'Alura Corp Inc', email: 'parcerias@aluracorp.com', telefone: '(11) 95555-4444', createdAt: dateOffset(-10) };

    const clientes = [client1, client2, client3, client4];

    // 2. Seed Projetos
    const p1Id = `demo_p1_${userId}`;
    const p2Id = `demo_p2_${userId}`;
    const p3Id = `demo_p3_${userId}`;
    const p4Id = `demo_p4_${userId}`;

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
    const r1Id = `demo_r1_${userId}`;
    const r2Id = `demo_r2_${userId}`;
    const r3Id = `demo_r3_${userId}`;
    const r4Id = `demo_r4_${userId}`;
    const r5Id = `demo_r5_${userId}`;
    const r6Id = `demo_r6_${userId}`;
    const r7Id = `demo_r7_${userId}`;

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
      dataPrevista: dateOffset(29),
      formaPagamento: 'Pix',
      status: 'A Receber',
      notaFiscal: 'Pendente',
      observacoes: 'Mensalidade de consultoria Referente a Julho/2026',
      createdAt: dateOffset(-1)
    };

    const recebimentos = [rec1, rec2, rec3, rec4, rec5, rec6, rec7];

    // Save to local cache first
    setLocal(`suitehub_clientes_${userId}`, clientes);
    setLocal(`suitehub_projetos_${userId}`, projetos);
    setLocal(`suitehub_recebimentos_${userId}`, recebimentos);

    // Save to Firestore
    try {
      const batch = writeBatch(db);

      clientes.forEach((c) => {
        batch.set(doc(db, 'clientes', c.id), c);
      });

      projetos.forEach((p) => {
        batch.set(doc(db, 'projetos', p.id), p);
      });

      recebimentos.forEach((r) => {
        batch.set(doc(db, 'recebimentos', r.id), r);
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch-seed-data');
    }

    return { clientes, projetos, recebimentos };
  }
};
