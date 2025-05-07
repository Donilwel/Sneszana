import { logout } from "./api";

export default function Logout({ token, onLogout }) {
    const handleLogout = async () => {
        const res = await logout(token);
        if (res.ok) {
            onLogout();
            alert("🚪 Вы вышли из аккаунта");
        } else {
            alert("❌ Не удалось выйти");
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
    padding: "0.6rem 1.2rem",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
};

