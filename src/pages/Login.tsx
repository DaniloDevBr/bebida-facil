import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { user, login, resetPassword } = useAuth();
  const navigate = useNavigate();

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
      setError('Falha ao entrar. Verifique suas credenciais.');
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
    <div className="login-background">
      <div className="login-card">
        <h1 className="login-title">Bem-vindo à Adega Online 🍷</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
            className="input-field"
          />
          <button
            type="submit"
            disabled={submitting}
            className={`btn-primary ${submitting ? 'disabled' : ''}`}
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <button
            onClick={() => {
              setShowForgotModal(true);
              setForgotEmail(email);
              setForgotError('');
              setForgotSuccess('');
            }}
            className="link-button"
          >
            Esqueci minha senha
          </button>
          <Link to="/register" className="link-button">
            Cadastre-se
          </Link>
        </div>

        <div className="catalogo-button-container">
          <button
            className="catalogo-button"
            onClick={() => navigate("/catalogo")}
          >
            Ver Catálogo de Produtos
          </button>
        </div>

        {showForgotModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h2 className="modal-title">Recuperar Senha</h2>
              {forgotError && <div className="alert alert-error">{forgotError}</div>}
              {forgotSuccess && <div className="alert alert-success">{forgotSuccess}</div>}
              <form onSubmit={handleForgotPassword} className="login-form">
                <input
                  type="email"
                  placeholder="Informe seu e-mail"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  disabled={loadingForgot}
                  className="input-field"
                  autoFocus
                />
                <div className="modal-buttons">
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
        /* Background elegante de adega */
        .login-background {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #4b1d1d 0%, #7b2e2e 50%, #f7f0eb 100%);
          font-family: 'Poppins', sans-serif;
          padding: 1rem;
        }

        /* Card */
        .login-card {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          border-radius: 2rem;
          padding: 3rem 2rem;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 15px 40px rgba(0,0,0,0.3);
          animation: fadeInScale 0.4s ease forwards;
          text-align: center;
        }

        .login-title {
          font-size: 2.25rem;
          font-weight: 900;
          color: #7b1d1d;
          margin-bottom: 2rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-field {
          padding: 0.75rem 1rem;
          font-size: 1rem;
          border-radius: 1rem;
          border: 1px solid #ccc;
          outline: none;
          transition: all 0.3s ease;
        }

        .input-field:focus {
          border-color: #7b1d1d;
          box-shadow: 0 0 0 3px rgba(123,29,29,0.2);
        }

        .btn-primary {
          background-color: #7b1d1d;
          color: white;
          font-weight: 700;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .btn-primary:hover {
          background-color: #5c1313;
        }

        .btn-primary.disabled {
          background-color: #c49a9a;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: #ccc;
          color: #111;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 1rem;
          cursor: pointer;
        }

        .btn-secondary:hover {
          background-color: #aaa;
        }

        .login-footer {
          margin-top: 1.5rem;
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #7b1d1d;
        }

        .link-button {
          background: none;
          border: none;
          color: #7b1d1d;
          font-weight: 600;
          cursor: pointer;
        }

        .link-button:hover {
          text-decoration: underline;
        }

        .catalogo-button-container {
          margin-top: 2rem;
        }

        .catalogo-button {
          width: 100%;
          padding: 0.75rem;
          background-color: #d97706;
          color: white;
          border-radius: 1rem;
          border: none;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }

        .catalogo-button:hover {
          background-color: #b45309;
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
          color: #7b1d1d;
        }

        .modal-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        /* Alertas */
        .alert {
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .alert-error {
          background: #fee2e2;
          color: #b91c1c;
        }

        .alert-success {
          background: #dcfce7;
          color: #15803d;
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
