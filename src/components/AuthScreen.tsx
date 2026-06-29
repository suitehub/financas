import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Mail, Lock, User, Sparkles, TrendingUp, Shield, HelpCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onSuccess: (uid: string, isNew: boolean) => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Por favor, informe seu nome.');
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Store profile name
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          name: name,
          email: email,
          createdAt: new Date().toISOString()
        });
        onSuccess(userCred.user.uid, true);
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        onSuccess(userCred.user.uid, false);
      }
    } catch (err: any) {
      console.error(err);
      let translatedError = 'Ocorreu um erro ao autenticar. Tente novamente.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        translatedError = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/email-already-in-use') {
        translatedError = 'Este e-mail já está sendo utilizado.';
      } else if (err.code === 'auth/weak-password') {
        translatedError = 'A senha deve possuir pelo menos 6 caracteres.';
      } else if (err.message) {
        translatedError = err.message;
      }
      setError(translatedError);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const userCred = await signInAnonymously(auth);
      // Create guest user profile
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        name: 'Convidado Suite Hub',
        email: 'guest@suitehub.com',
        isGuest: true,
        createdAt: new Date().toISOString()
      });
      // We will trigger seed data for this guest user in App.tsx
      onSuccess(userCred.user.uid, true);
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível conectar como Convidado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800/80 p-8 shadow-xl relative overflow-hidden">
        {/* Decorative ambient blobs */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20 mb-4">
            <TrendingUp size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Suite Hub <span className="font-light text-emerald-500">Finanças</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Controle de faturamento inteligente para autônomos e freelancers.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                Seu Nome
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 dark:text-zinc-500">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-all placeholder-zinc-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
              E-mail
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 dark:text-zinc-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-all placeholder-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
              Senha
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 dark:text-zinc-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-all placeholder-zinc-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              'Criar Minha Conta'
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>

        <div className="mt-5 text-center relative z-10">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {isSignUp ? 'Já possui conta? Faça Login' : 'Não tem uma conta? Cadastre-se'}
          </button>
        </div>

        <div className="relative my-6 z-10">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 dark:text-zinc-500 font-medium">OU TESTAR IMEDIATAMENTE</span>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-200/50 dark:border-zinc-700/40"
          >
            <Sparkles size={16} className="text-amber-500 shrink-0" />
            <span>Acessar Modo Demonstrativo</span>
          </button>
          <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500">
            Acesso instantâneo sem cadastro, pré-carregado com dados de exemplo.
          </p>
        </div>
      </div>
    </div>
  );
}
