// src/pages/LoginCliente.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";

export default function LoginCliente() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      // substitui o histórico, assim o "voltar" leva para login
      navigate("/produtos", { replace: true });
    } catch (e) {
      console.error(e);
      setErro("E-mail ou senha inválidos.");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-20 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Login Cliente</h2>
      {erro && <p className="text-red-600 mb-2">{erro}</p>}
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-3"
      />
      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-3"
      />
      <button
        onClick={handleLogin}
        className="w-full bg-indigo-600 text-white px-3 py-2 rounded"
      >
        Entrar
      </button>
    </div>
  );
}
