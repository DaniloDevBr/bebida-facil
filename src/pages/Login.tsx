import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const Login: React.FC = () => {
  const { user, login, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loadingForgot, setLoadingForgot] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError('Falha ao entrar. Verifique as credenciais.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setLoadingForgot(true);
    try {
      if (!forgotEmail) {
        setForgotError('Informe seu e-mail para recuperação.');
        setLoadingForgot(false);
        return;
      }
      await resetPassword(forgotEmail);
      setForgotSuccess('E-mail de recuperação enviado com sucesso!');
    } catch {
      setForgotError('Erro ao enviar e-mail. Verifique o endereço informado.');
    } finally {
      setLoadingForgot(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 flex items-center justify-center px-4">
      <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full p-10 sm:p-12 animate-fadeInScale">
        <h1 className="text-4xl font-extrabold mb-10 text-center text-gray-900 tracking-wide">
          Bem-vindo de volta
        </h1>

        {error && (
          <div
            className="mb-6 bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center gap-3"
            role="alert"
          >
            <svg
              className="w-6 h-6 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M6.343 6.343l12.728 12.728" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-7">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
            className="border border-gray-300 rounded-lg px-5 py-3 w-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-400 focus:border-indigo-600 transition"
            id="email"
            aria-label="E-mail"
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
            className="border border-gray-300 rounded-lg px-5 py-3 w-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-400 focus:border-indigo-600 transition"
            id="password"
            aria-label="Senha"
          />

          <button
            type="submit"
            disabled={submitting}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition duration-300 ${
              submitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 flex justify-between items-center text-sm text-indigo-700 font-semibold">
          <button
            onClick={() => {
              setShowForgotModal(true);
              setForgotEmail(email);
              setForgotError('');
              setForgotSuccess('');
            }}
            className="hover:underline focus:outline-none"
          >
            Esqueci minha senha
          </button>

          <Link
            to="/register"
            className="hover:underline"
          >
            Cadastre-se
          </Link>
        </div>

        {/* Modal de recuperação de senha */}
        {showForgotModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            aria-modal="true"
            role="dialog"
            aria-labelledby="modal-title"
            aria-describedby="modal-desc"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-fadeInScale relative">
              <h2
                id="modal-title"
                className="text-2xl font-semibold mb-6 text-gray-900 text-center"
              >
                Recuperar Senha
              </h2>

              {forgotError && (
                <div
                  className="mb-4 bg-red-50 text-red-800 p-3 rounded-lg border border-red-200 flex items-center gap-2"
                  role="alert"
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M6.343 6.343l12.728 12.728" />
                  </svg>
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div
                  className="mb-4 bg-green-50 text-green-800 p-3 rounded-lg border border-green-200 flex items-center gap-2"
                  role="alert"
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{forgotSuccess}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
                <input
                  type="email"
                  placeholder="Informe seu e-mail"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  disabled={loadingForgot}
                  className="border border-gray-300 rounded-lg px-5 py-3 w-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-400 transition"
                  autoFocus
                  id="forgot-email"
                  aria-label="Informe seu e-mail para recuperação"
                />

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    disabled={loadingForgot}
                    className="px-5 py-2 rounded-xl bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingForgot}
                    className={`px-5 py-2 rounded-xl font-semibold text-white transition ${
                      loadingForgot ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {loadingForgot ? 'Enviando...' : 'Enviar E-mail'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-fadeInScale { animation: fadeInScale 0.3s ease forwards; }
        `}
      </style>
    </div>
  );
};

export default Login;
