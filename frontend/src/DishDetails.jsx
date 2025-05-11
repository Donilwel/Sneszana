import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function DishDetails({ token }) {
    const { id: id } = useParams();
    const navigate = useNavigate();
    const [dish, setDish] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        setError("");

        fetch(`/api/restaurants/menu/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then((res) => {
                if (!res.ok) throw new Error("Блюдо не найдено");
                return res.json();
            })
            .then((data) => {
                if (!data || data.message) throw new Error(data?.message || "Неверный формат данных");
                setDish(data);
            })
            .catch((err) => {
                setError(err.message);
                console.error("Ошибка загрузки блюда:", err);
            })
            .finally(() => setLoading(false));
    }, [id, token]);

    if (loading) return (
        <div style={loadingStyle}>
            <div className="spinner"></div>
            <p>Загрузка информации о блюде...</p>
        </div>
    );

    if (error) return (
        <div style={errorContainerStyle}>
            <p style={errorStyle}>{error}</p>
            <button onClick={() => navigate(-1)} style={backButtonStyle}>
                Вернуться назад
            </button>
        </div>
    );

    if (!dish) return <p>Блюдо не найдено</p>;

    return (
        <div style={wrapperStyle}>
            <div style={cardStyle}>
                <img
                    src={dish.imageURL || dish.ImageURL || "https://via.placeholder.com/600x300"}
                    alt={dish.name || dish.Name || "Блюдо"}
                    style={imageStyle}
                />
                <div style={contentStyle}>
                    <h2 style={titleStyle}>{dish.name || dish.Name}</h2>
                    <p style={textStyle}><strong>Описание:</strong> {dish.description || dish.Description || "Нет описания"}</p>
                    <p style={textStyle}><strong>Ингредиенты:</strong> {dish.ingredients || dish.Ingredients || "Не указаны"}</p>
                    <p style={priceStyle}><strong>Цена:</strong> {dish.price || dish.Price} ₽</p>
                </div>
            </div>

            <div style={buttonWrapperStyle}>
                <button
                    onClick={() => navigate(`/dish/${id}/reviews`)}
                    style={reviewButtonStyle}
                >
                    Посмотреть отзывы
                </button>
                <button
                    onClick={() => navigate(`/dish/${id}/write-review`)}
                    style={writeReviewButtonStyle}
                >
                    Написать отзыв
                </button>
            </div>
        </div>
    );
}

// Стили
const wrapperStyle = {
    maxWidth: "800px",
    margin: "2rem auto",
    padding: "1rem",
};

const cardStyle = {
    display: "flex",
    flexDirection: "column",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "#fff",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
};

const imageStyle = {
    width: "100%",
    height: "300px",
    objectFit: "cover",
};

const contentStyle = {
    padding: "1.5rem",
};

const titleStyle = {
    fontSize: "1.8rem",
    marginBottom: "1rem",
    color: "#333",
};

const textStyle = {
    marginBottom: "0.8rem",
    fontSize: "1rem",
    lineHeight: "1.5",
};

const priceStyle = {
    fontSize: "1.3rem",
    fontWeight: "bold",
    color: "#28a745",
    margin: "1rem 0",
};

const buttonWrapperStyle = {
    display: "flex",
    justifyContent: "center",
    marginTop: "2rem",
    gap: "1rem",
};

const reviewButtonStyle = {
    padding: "0.8rem 1.8rem",
    backgroundColor: "#FF6347",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
};

const writeReviewButtonStyle = {
    padding: "0.8rem 1.8rem",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
};

const loadingStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    gap: "1rem",
};

const errorContainerStyle = {
    maxWidth: "800px",
    margin: "2rem auto",
    padding: "2rem",
    textAlign: "center",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};

const errorStyle = {
    color: "#dc3545",
    fontSize: "1.1rem",
    marginBottom: "1.5rem",
};

const backButtonStyle = {
    padding: "0.6rem 1.2rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
};