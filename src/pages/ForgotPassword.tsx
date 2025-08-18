import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } catch {
      setError('Erro ao enviar email. Verifique o endereço digitado.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Recuperar Senha</h1>

        {message && (
          <div className="mb-4 bg-green-100 text-green-700 p-3 rounded border border-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-100 text-red-700 p-3 rounded border border-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded shadow transition disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar email'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
