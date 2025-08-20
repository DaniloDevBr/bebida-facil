import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import "../styles/register.css";

const Register: React.FC = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState<'cliente' | 'admin'>('cliente');
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState('');

  const ADMIN_SECRET = "Tl3500!@"; 

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.');
      return;
    }

    if (role === "admin" && adminSecret !== ADMIN_SECRET) {
      setError("Senha de administrador incorreta.");
      return;
    }

    try {
      setError('');
      await register(email, password, role);

      // 🔹 Redireciona baseado no papel
      if (role === "cliente") {
        navigate("/catalogocliente");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError('Falha ao criar a conta.');
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1 className="register-title">Cadastro</h1>

        {error && (
          <div className="register-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="register-input"
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="register-input"
          />

          <input
            type="password"
            placeholder="Confirme a senha"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            className="register-input"
          />

          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value as "cliente" | "admin")} 
            className="register-select"
          >
            <option value="cliente">Cliente</option>
            <option value="admin">Administrador</option>
          </select>

          {role === "admin" && (
            <input
              type="password"
              placeholder="Senha de Administrador"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              className="register-input"
            />
          )}

          <button type="submit" className="register-button">
            Cadastrar
          </button>
        </form>

        <p className="register-text">
          Já tem conta?{' '}
          <Link to="/login" className="register-link">Faça login</Link>
        </p>
        <p className="register-text">
          Esqueceu a senha?{' '}
          <Link to="/forgot-password" className="register-link">Recuperar senha</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
