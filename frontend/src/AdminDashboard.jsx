import { Link } from "react-router-dom";

export default function AdminDashboard() {
    // Стили в формате JS объектов
    const styles = {
        dashboard: {
            maxWidth: "1200px",
            margin: "2rem auto",
            padding: "0 1rem",
        },
        title: {
            textAlign: "center",
            marginBottom: "2rem",
            color: "#333",
        },
        grid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
            "@media (max-width: 768px)": {
                gridTemplateColumns: "1fr",
            },
        },
        card: {
            display: "block",
            padding: "1.5rem",
            backgroundColor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            transition: "transform 0.2s, box-shadow 0.2s",
            textDecoration: "none",
            color: "#333",
            border: "1px solid #eaeaea",
            ":hover": {
                transform: "translateY(-5px)",
                boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
            },
        },
        cardIcon: {
            fontSize: "2.5rem",
            marginBottom: "1rem",
        },
        cardTitle: {
            margin: "0 0 0.5rem 0",
            color: "#2c3e50",
        },
        cardDescription: {
            margin: "0",
            color: "#7f8c8d",
            fontSize: "0.9rem",
        },
        quickMenu: {
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
        },
        quickLink: {
            padding: "0.5rem 1rem",
            backgroundColor: "#28a745",
            color: "white",
            borderRadius: "5px",
            textDecoration: "none",
            fontSize: "0.9rem",
            ":hover": {
                backgroundColor: "#218838",
            },
        },
    };

    return (
        <div style={styles.dashboard}>
            <h1 style={styles.title}>Панель администратора</h1>

            {/* Быстрое меню для важных действий */}
            <div style={styles.quickMenu}>
                <Link to="/admin/users/new" style={styles.quickLink}>
                    + Добавить пользователя
                </Link>
                <Link to="/admin/dishes/new" style={styles.quickLink}>
                    + Добавить блюдо
                </Link>
                <Link to="/admin/orders" style={styles.quickLink}>
                    Последние заказы
                </Link>
            </div>

            {/* Основные карточки разделов */}
            <div style={styles.grid}>
                <Link to="/admin/users" style={styles.card}>
                    <div style={styles.cardIcon}>👥</div>
                    <h3 style={styles.cardTitle}>Управление пользователями</h3>
                    <p style={styles.cardDescription}>Просмотр, создание и редактирование пользователей системы</p>
                </Link>

                <Link to="/admin/dishes" style={styles.card}>
                    <div style={styles.cardIcon}>🍽️</div>
                    <h3 style={styles.cardTitle}>Управление меню</h3>
                    <p style={styles.cardDescription}>Редактирование блюд, категорий и ингредиентов</p>
                </Link>

                <Link to="/admin/orders" style={styles.card}>
                    <div style={styles.cardIcon}>📦</div>
                    <h3 style={styles.cardTitle}>Управление заказами</h3>
                    <p style={styles.cardDescription}>Просмотр и управление всеми заказами</p>
                </Link>

                <Link to="/admin/stats" style={styles.card}>
                    <div style={styles.cardIcon}>📊</div>
                    <h3 style={styles.cardTitle}>Статистика</h3>
                    <p style={styles.cardDescription}>Аналитика и отчеты по работе ресторана</p>
                </Link>

                <Link to="/admin/settings" style={styles.card}>
                    <div style={styles.cardIcon}>⚙️</div>
                    <h3 style={styles.cardTitle}>Настройки</h3>
                    <p style={styles.cardDescription}>Системные настройки приложения</p>
                </Link>
            </div>
        </div>
    );
}