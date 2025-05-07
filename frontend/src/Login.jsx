import { useState } from "react";
import { login } from "./api";

export default function Login({ onLogin }) {
    const [form, setForm] = useState({ email: "", password: "" });
    const [msg, setMsg] = useState("");
    const [isError, setIsError] = useState(false);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await login(form);
            const data = await res.json();

            if (!res.ok || !data.token) {
                throw new Error(data.message || "Ошибка входа");
            }

            onLogin(data.token);
            setMsg("✅ Вход выполнен успешно");
            setIsError(false);
        } catch (err) {
            setMsg(`❌ ${err.message}`);
            setIsError(true);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={formStyle}>
            <h2 style={{ textAlign: "center" }}>🔐 Вход в аккаунт</h2>
            <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                style={inputStyle}
                required
            />
            <input
                name="password"
                type="password"
                placeholder="Пароль"
                value={form.password}
                onChange={handleChange}
                style={inputStyle}
                required
            />
            <button type="submit" style={buttonStyle}>
                Войти
            </button>
            {msg && (
                <p style={isError ? errorStyle : successStyle}>{msg}</p>
            )}
        </form>
    );
}

const formStyle = {
    maxWidth: "400px",
    margin: "2rem auto",
    padding: "2rem",
    borderRadius: "12px",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
};

const inputStyle = {
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
};

const buttonStyle = {
    padding: "0.75rem",
    backgroundColor: "#28a745",
    color: "white",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
};

const successStyle = {
    color: "green",
    textAlign: "center",
};

const errorStyle = {
    color: "red",
    textAlign: "center",
};
