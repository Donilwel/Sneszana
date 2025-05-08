import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function DishDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dish, setDish] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`/api/restaurants/menu/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.message) throw new Error(data.message);
                setDish(data);
            })
            .catch((err) => setError(err.message));
    }, [id]);

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!dish) return <p>Загрузка...</p>;

    return (
        <div style={wrapperStyle}>
            <button onClick={() => navigate(-1)} style={buttonStyle}>
                ← Назад к меню
            </button>
            <div style={cardStyle}>
                <img
                    src={dish.ImageURL || "https://via.placeholder.com/600x300"}
                    alt={dish.Name}
                    style={imageStyle}
                />
                <h2>{dish.Name}</h2>
                <p><strong>Описание:</strong> {dish.Description}</p>
                <p><strong>Ингредиенты:</strong> {dish.Ingredients}</p>
                <p><strong>Цена:</strong> {dish.Price} ₽</p>
            </div>

            {/* Кнопки для перехода на страницы отзывов */}
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

const wrapperStyle = {
    maxWidth: "700px",
    margin: "2rem auto",
    padding: "1rem",
};

const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "1.5rem",
    backgroundColor: "#fff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};

const imageStyle = {
    width: "100%",
    borderRadius: "10px",
    marginBottom: "1rem",
};

const buttonStyle = {
    marginBottom: "1rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#eee",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
};

const buttonWrapperStyle = {
    display: "flex",
    justifyContent: "center", // Центрирование кнопок
    marginTop: "1rem",
    gap: "1rem", // Отступ между кнопками
};

const reviewButtonStyle = {
    padding: "0.8rem 1.5rem",
    backgroundColor: "#FF6347", // Томато цвет
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.3s ease",
    ":hover": {
        backgroundColor: "#FF4500", // Более темный красный при наведении
        transform: "scale(1.05)",     // Легкое увеличение кнопки
    },
    ":active": {
        backgroundColor: "#FF6347",  // Возвращение к исходному цвету при нажатии
        transform: "scale(0.95)",     // Легкое уменьшение кнопки
    }
};

const writeReviewButtonStyle = {
    padding: "0.8rem 1.5rem",
    backgroundColor: "#28a745", // Зеленый цвет для кнопки "Написать отзыв"
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.3s ease",
    ":hover": {
        backgroundColor: "#218838", // Темно-зеленый при наведении
        transform: "scale(1.05)",
    },
    ":active": {
        backgroundColor: "#28a745",
        transform: "scale(0.95)",
    }
};
