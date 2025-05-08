import { logout } from "./api";

export default function Logout({ token, onLogout }) {
    const handleLogout = async () => {
        try {
            const res = await logout(token);
            if (res.ok) {
                onLogout();
                alert("🚪 Вы вышли из аккаунта");
            } else {
                alert("❌ Не удалось выйти");
            }
        } catch (error) {
            alert("❌ Ошибка сети или сервера");
        }
    };

    return (
        <div style={{ textAlign: "right", marginBottom: "1rem" }}>
            <button onClick={handleLogout} style={buttonStyle}>
                🚪 Выйти
            </button>
        </div>
    );
}

const buttonStyle = {
    padding: "0.75rem 1.5rem",  // Увеличим размеры кнопки для удобства
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.2s", // Добавляем плавное изменение при наведении
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)", // Немного тени для кнопки
};

const buttonHoverStyle = {
    backgroundColor: "#c82333", // Тёмный оттенок красного при наведении
    transform: "scale(1.05)", // Лёгкое увеличение при наведении
};
