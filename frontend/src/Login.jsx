mport { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "./api";

export default function Login({ onLogin }) {
    const [form, setForm] = useState({ email: "", password: "" });
    const [msg, setMsg] = useState("");
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMsg("");

        try {
            const res = await login(form);
            const data = await res.json();

            if (!res.ok || !data.token) {
                throw new Error(data.message || "Ошибка входа");
            }

            // Декодируем токен чтобы получить роль пользователя
            const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
            const userRole = tokenPayload.role || "CUSTOMER_ROLE";

            onLogin(data.token);
            setMsg("✅ Вход выполнен успешно");
            setIsError(false);

            // Перенаправляем в зависимости от роли
            if (userRole === "ADMIN_ROLE") {
                navigate("/admin");
            } else {
                navigate("/");
            }

        } catch (err) {
            setMsg(`❌ ${err.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={formStyle}>
            <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>🔐 Вход в аккаунт</h2>

            <div style={inputContainer}>
                <label htmlFor="email" style={labelStyle}>Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@mail.ru"
                    value={form.email}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                    disabled={isLoading}
                />
            </div>

            <div style={inputContainer}>
                <label htmlFor="password" style={labelStyle}>Пароль</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                    disabled={isLoading}
                />
            </div>

            <button
                type="submit"
                style={{
                    ...buttonStyle,
                    ...(isLoading ? disabledButtonStyle : {})
                }}
                disabled={isLoading}
            >
                {isLoading ? "Загрузка..." : "Войти"}
            </button>

            {msg && (
                <p style={isError ? errorStyle : successStyle}>{msg}</p>
            )}

            <p style={{ textAlign: "center", marginTop: "1rem" }}>
                Нет аккаунта?{" "}
                <button
                    type="button"
                    onClick={() => navigate("/register")}
                    style={linkBtn}
                    disabled={isLoading}
                >
                    Зарегистрироваться
                </button>
            </p>
        </form>
    );
}

// Стили
const formStyle = {
    maxWidth: "400px",
    margin: "2rem auto",
    padding: "2rem",
    borderRadius: "12px",
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
};

const inputContainer = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
};

const labelStyle = {
    fontSize: "0.9rem",
    color: "#555",
    fontWeight: "500",
};

const inputStyle = {
    padding: "0.75rem 1rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "1rem",
    transition: "border-color 0.2s",
    ":focus": {
        outline: "none",
        borderColor: "#28a745",
        boxShadow: "0 0 0 2px rgba(40, 167, 69, 0.2)",
    },
};

const buttonStyle = {
    padding: "0.75rem",
    backgroundColor: "#28a745",
    color: "white",
    fontWeight: "600",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.2s, transform 0.1s",
    ":hover": {
        backgroundColor: "#218838",
    },
    ":active": {
        transform: "scale(0.98)",
    },
};

const disabledButtonStyle = {
    backgroundColor: "#cccccc",
    cursor: "not-allowed",
    ":hover": {
        backgroundColor: "#cccccc",
    },
};

const linkBtn = {
    background: "none",
    border: "none",
    color: "#007bff",
    cursor: "pointer",
    fontSize: "1rem",
    textDecoration: "underline",
    padding: 0,
    ":hover": {
        color: "#0056b3",
    },
};

const successStyle = {
    color: "#28a745",
    textAlign: "center",
    margin: "0.5rem 0",
};

const errorStyle = {
    color: "#dc3545",
    textAlign: "center",
    margin: "0.5rem 0",
};