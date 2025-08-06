import React, { useState } from "react";
import { useAuth } from "../services/AuthContext";
import { Navigate, Link } from "react-router-dom";

const Register: React.FC = () => {
  const { user, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setError("");
      await register(email, password);
    } catch {
      setError("Falha ao criar a conta.");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 50 }}>
      <h1>Cadastro</h1>
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
        <input
          type="password"
          placeholder="Confirme a senha"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          className="p-2 border rounded"
        />
        <button type="submit">Cadastrar</button>
      </form>
      <p style={{ marginTop: 15 }}>
        Já tem conta?{" "}
        <Link to="/login" style={{ color: "#007bff" }}>
          Faça login
        </Link>
      </p>
    </div>
  );
};

export default Register;
