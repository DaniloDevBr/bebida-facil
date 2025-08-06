import React, { useState } from "react";
import { useAuth } from "../services/AuthContext.tsx";
import { Navigate, Link } from "react-router-dom";

const Login: React.FC = () => {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      await login(email, password);
    } catch {
      setError("Falha ao entrar. Verifique as credenciais.");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 50 }}>
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-2 border rounded"
        />
        <button type="submit">Entrar</button>
      </form>
      <p style={{ marginTop: 15 }}>
        Não tem conta?{" "}
        <Link to="/register" style={{ color: "#007bff" }}>
          Cadastre-se
        </Link>
      </p>
    </div>
  );
};

export default Login;
