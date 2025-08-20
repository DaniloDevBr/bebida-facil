import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { useAuthRole } from '../services/AuthRoleContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import "../styles/login.css";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, resetPassword } = useAuth();
  const { role, loading: roleLoading } = useAuthRole();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loadingForgot, setLoadingForgot] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // 🔹 Redirecionamento quando user e role já carregaram
  useEffect(() => {
    if (user && !roleLoading && role) {
      const userRole = role.toLowerCase();
      if (userRole === "admin") setRedirectPath("/dashboard");
      else if (userRole === "cliente") setRedirectPath("/catalogo");
      else setRedirectPath("/catalogo");
    }
  }, [user, role, roleLoading]);

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  if (roleLoading) {
    return <div style={{ textAlign: 'center', marginTop: 50 }}>Carregando...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      // 🔹 O useEffect acima irá redirecionar automaticamente
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
        <h1 className="login-title">Bem-vindo à Drink Lab 🍷</h1>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={submitting}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
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
          <Link to="/register" className="link-button">Cadastre-se</Link>
        </div>

        {/* Catálogo público */}
        <div className="login-footer-catalogo">
          <button
            onClick={() => navigate('/catalogo-publico')}
            className="btn-secondary"
          >
            Ver Catálogo Público
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
                  onChange={e => setForgotEmail(e.target.value)}
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
    </div>
  );
};

export default Login;
