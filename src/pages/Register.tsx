import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const Register: React.FC = () => {
  const { user, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      setError('');
      await register(email, password);
    } catch {
      setError('Falha ao criar a conta.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Cadastro</h1>

        {error && (
          <div className="mb-4 bg-red-100 text-red-700 p-3 rounded border border-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />

          <input
            type="password"
            placeholder="Confirme a senha"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded shadow transition"
          >
            Cadastrar
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Já tem conta?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            Faça login
          </Link>
        </p>
        <p className="mt-2 text-center text-gray-600">
          Esqueceu a senha?{' '}
          <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            Recuperar senha
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
