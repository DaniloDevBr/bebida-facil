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
      <div className="login-card">
        <h1 className="login-title">Bem-vindo de volta</h1>

        {error && (
          <div className="alert alert-error" role="alert">
            <svg className="alert-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M6.343 6.343l12.728 12.728" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
            className="input-field"
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
            className="input-field"
            id="password"
            aria-label="Senha"
          />

          <button
            type="submit"
            disabled={submitting}
            className={`btn-primary ${submitting ? 'disabled' : ''}`}
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 flex justify-between items-center text-sm font-semibold text-indigo-700">
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
          <Link to="/register" className="hover:underline">
            Cadastre-se
          </Link>
        </div>

        {/* Modal de recuperação de senha */}
        {showForgotModal && (
          <div className="modal-backdrop" aria-modal="true" role="dialog">
            <div className="modal-card">
              <h2 className="modal-title">Recuperar Senha</h2>

              {forgotError && <div className="alert alert-error">{forgotError}</div>}
              {forgotSuccess && <div className="alert alert-success">{forgotSuccess}</div>}

              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="Informe seu e-mail"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  disabled={loadingForgot}
                  className="input-field"
                  autoFocus
                  id="forgot-email"
                  aria-label="Informe seu e-mail para recuperação"
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    disabled={loadingForgot}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingForgot}
                    className={`btn-primary ${loadingForgot ? 'disabled' : ''}`}
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
          /* Card Login */
          .login-card {
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(12px);
            border-radius: 2rem;
            padding: 3rem 2rem;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            animation: fadeInScale 0.3s ease forwards;
          }

          .login-title {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111827;
            text-align: center;
            margin-bottom: 2.5rem;
          }

          .input-field {
            border: 1px solid #d1d5db;
            border-radius: 1rem;
            padding: 0.75rem 1rem;
            width: 100%;
            outline: none;
            font-size: 1rem;
            transition: all 0.3s ease;
          }

          .input-field:focus {
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79,70,229,0.2);
          }

          .btn-primary {
            background: #4f46e5;
            color: #fff;
            font-weight: 700;
            padding: 0.75rem 1rem;
            border-radius: 1rem;
            transition: background 0.3s ease;
          }

          .btn-primary:hover {
            background: #4338ca;
          }

          .btn-primary.disabled {
            background: #a5b4fc;
            cursor: not-allowed;
          }

          .btn-secondary {
            background: #d1d5db;
            color: #111827;
            font-weight: 600;
            padding: 0.5rem 1rem;
            border-radius: 1rem;
            transition: background 0.3s ease;
          }

          .btn-secondary:hover {
            background: #9ca3af;
          }

          /* Alerts */
          .alert {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            border-radius: 1rem;
            font-size: 0.9rem;
          }

          .alert-error {
            background: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
          }

          .alert-success {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #a7f3d0;
          }

          .alert-icon {
            width: 1.25rem;
            height: 1.25rem;
          }

          /* Modal */
          .modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 50;
            padding: 1rem;
          }

          .modal-card {
            background: #fff;
            border-radius: 2rem;
            padding: 2rem;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            animation: fadeInScale 0.3s ease forwards;
          }

          .modal-title {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 1rem;
            text-align: center;
          }

          /* Animação */
          @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

export default Login;
