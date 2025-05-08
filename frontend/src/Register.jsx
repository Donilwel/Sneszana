import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "./api";

export default function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        password: "",
    });
    const [msg, setMsg] = useState("");
    const [isError, setIsError] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await register(form);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Ошибка регистрации");
            }

            setMsg("✅ Пользователь успешно зарегистрирован!");
            setIsError(false);
        } catch (err) {
            setMsg(`❌ ${err.message}`);
            setIsError(true);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={formStyle}>
            <h2 style={{ textAlign: "center" }}>📝 Регистрация</h2>
            <input
                name="name"
                placeholder="Имя"
                value={form.name}
                onChange={handleChange}
                style={inputStyle}
                required
            />
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
                name="phoneNumber"
                placeholder="Телефон"
                value={form.phoneNumber}
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
                Зарегистрироваться
            </button>
            {msg && (
                <p style={isError ? errorStyle : successStyle}>
                    {msg}
                </p>
            )}
            <p style={{ textAlign: "center" }}>
                Уже есть аккаунт?{" "}
                <button type="button" onClick={() => navigate("/")} style={linkBtn}>
                    Войти
                </button>
            </p>
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
    backgroundColor: "#007bff",
    color: "white",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
};

const linkBtn = {
    background: "none",
    border: "none",
    color: "#007bff",
    cursor: "pointer",
    fontSize: "1rem",
    textDecoration: "underline",
    padding: 0,
};

const successStyle = {
    color: "green",
    textAlign: "center",
};

const errorStyle = {
    color: "red",
    textAlign: "center",
};
