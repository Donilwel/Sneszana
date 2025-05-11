import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function AdminDashboard({ token }) {
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
        badge: {
            position: "absolute",
            top: "-8px",
            right: "-8px",
            backgroundColor: "#dc3545",
            color: "white",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
        },
        cardContainer: {
            position: "relative",
        }
    };

    const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

    useEffect(() => {
        const fetchPendingReviews = async () => {
            try {
                const response = await fetch('/api/admin/reviews', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch pending reviews');
                }

                const data = await response.json();
                setPendingReviewsCount(data.length);
            } catch (error) {
                console.error('Error fetching pending reviews:', error);
            }
        };

        if (token) {
            fetchPendingReviews();
        }
    }, [token]);

    return (
        <div style={styles.dashboard}>
            <h1 style={styles.title}>Панель администратора</h1>

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
                <Link to="/admin/reviews" style={styles.card}>
                    <div style={styles.cardIcon}>📝</div>
                    <h3 style={styles.cardTitle}>Управление отзывами</h3>
                    <p style={styles.cardDescription}>Модерация и управление отзывами пользователей</p>
                </Link>

                <Link to="/admin/couriers" style={styles.card}>
                    <div style={styles.cardIcon}>🚴</div>
                    <h3 style={styles.cardTitle}>Управление курьерами</h3>
                    <p style={styles.cardDescription}>Просмотр и управление курьерами системы</p>
                </Link>

            </div>
        </div>
    );
}