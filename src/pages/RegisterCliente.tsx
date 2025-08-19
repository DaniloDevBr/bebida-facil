// src/pages/RegisterCliente.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function RegisterCliente() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (!email || !senha || !nome) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      // Cria usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Cria registro no Firestore
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nome,
        email,
        role: "cliente",
        criadoEm: serverTimestamp(),
      });

      setMensagem("Cadastro realizado com sucesso!");
      setEmail("");
      setSenha("");
      setNome("");

      // Redireciona para login do cliente
      navigate("/loginclientes");
    } catch (error: any) {
      console.error(error);
      setMensagem(error.message || "Erro ao cadastrar usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Cadastro Cliente</h2>
        {mensagem && <p className="mb-4 text-red-600">{mensagem}</p>}

        <label className="block mb-2 font-semibold">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border px-3 py-2 mb-4 rounded"
        />

        <label className="block mb-2 font-semibold">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-3 py-2 mb-4 rounded"
        />

        <label className="block mb-2 font-semibold">Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border px-3 py-2 mb-6 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 transition"
        >
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </div>
  );
}
