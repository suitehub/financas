import React, { useState } from 'react';
import {
  TrendingUp,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Chrome
} from 'lucide-react';
import { authService } from '../services/authService';

interface LoginScreenProps {
  onLoginSuccess: (userId: string, username: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const session = await authService.loginWithGoogle();
      onLoginSuccess(session.userId, session.nome);
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.message === 'auth/popup-blocked' || err.code === 'auth/popup-blocked') {
        setError('O pop-up de login do Google foi bloqueado pelo navegador. Desbloqueie pop-ups ou utilize login por E-mail e Senha.');
      } else if (err.message === 'auth/unauthorized-domain' || err.code === 'auth/unauthorized-domain') {
        setError('Este domínio ainda não está na lista de domínios autorizados do Google OAuth no Firebase Console. Utilize o cadastro e login por E-mail e Senha.');
      } else {
        setError('Utilize o cadastro e login por E-mail e Senha abaixo para acesso instantâneo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (isRegister && !name.trim()) {
      setError('Por favor, preencha o seu nome completo.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const session = await authService.register(name.trim(), cleanEmail, password);
        setSuccess('Conta criada com sucesso! Entrando...');
        setTimeout(() => {
          onLoginSuccess(session.userId, session.nome);
        }, 400);
      } else {
        const session = await authService.login(cleanEmail, password);
        onLoginSuccess(session.userId, session.nome);
      }
    } catch (err: any) {
      console.error('Auth submit error:', err);
      if (err.message === 'auth/email-already-in-use' || err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Tente entrar na aba "Entrar" ou use outro e-mail.');
      } else if (err.message === 'auth/wrong-password' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Senha incorreta para este e-mail. Por favor, tente novamente.');
      } else if (err.message === 'auth/weak-password' || err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Erro ao processar autenticação. Verifique os dados inseridos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo and Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">
              Suite Hub Finanças
            </h1>
            <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
              Gestão financeira ágil para freelancers e agências
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => {
                setIsRegister(false);
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                !isRegister
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              } disabled:opacity-50`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                isRegister
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              } disabled:opacity-50`}
            >
              Criar Conta
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3.5 rounded-2xl text-xs border border-red-100/50 dark:border-red-900/30 font-medium animate-in fade-in zoom-in duration-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-2xl text-xs border border-emerald-100/50 dark:border-emerald-900/30 font-medium animate-in fade-in zoom-in duration-200">
              <CheckCircle size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name (Registration only) */}
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                  Nome Completo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-850 rounded-2xl text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium disabled:opacity-65"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  disabled={loading}
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-850 rounded-2xl text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium disabled:opacity-65"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-850 rounded-2xl text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium disabled:opacity-65"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black rounded-2xl text-xs transition-colors shadow-md shadow-emerald-500/15 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-75"
            >
              <span>{loading ? 'Processando...' : isRegister ? 'Criar Minha Conta' : 'Acessar Conta'}</span>
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          {/* Social login divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100 dark:border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">ou</span>
            <div className="flex-grow border-t border-slate-100 dark:border-zinc-800"></div>
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-extrabold rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
          >
            <Chrome size={16} className="text-emerald-500 dark:text-emerald-400" />
            <span>{loading ? 'Carregando...' : 'Entrar com o Google'}</span>
          </button>

        </div>

      </div>
    </div>
  );
}
