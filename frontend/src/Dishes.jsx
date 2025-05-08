import { useEffect, useState } from "react";
import { getDishes } from "./api";
import { Link } from "react-router-dom";

export default function Dishes({ token }) {
    const [dishes, setDishes] = useState([]);
    const [error, setError] = useState("");
    const [hovered, setHovered] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all");

    const categories = ["all", "суп", "второе", "салат", "напиток", "сладкое", "завтрак"];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getDishes(token);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Ошибка загрузки блюд");
                setDishes(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchData();
    }, [token]);

    const filtered = selectedCategory === "all"
        ? dishes
        : dishes.filter((d) => d.Category === selectedCategory);

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (dishes.length === 0) return <p>Загрузка меню...</p>;

    return (
        <div style={{ padding: "2rem" }}>
            <h2 style={titleStyle}>🍽 Меню ресторана</h2>
            <div style={categoryStyle}>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                            ...catBtn,
                            ...(selectedCategory === cat ? catBtnActive : {}),
                        }}
                    >
                        {cat[0].toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>
            <div style={gridStyle}>
                {filtered.map((dish) => (
                    <div
                        key={dish.ID}
                        style={{
                            ...cardStyle,
                            ...(hovered === dish.ID ? hoveredCardStyle : {}),
                        }}
                        onMouseEnter={() => setHovered(dish.ID)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <Link to={`/dish/${dish.ID}`} style={linkStyle}>
                            <img
                                src={dish.ImageURL || "https://via.placeholder.com/300x200"}
                                alt={dish.Name}
                                style={imageStyle}
                            />
                        </Link>
                        <div style={infoStyle}>
                            <h3>{dish.Name}</h3>
                            <p style={{ fontSize: "0.9rem", color: "#555" }}>{dish.Description}</p>
                            <p style={{ fontWeight: "bold" }}>{dish.Price} ₽</p>
                            <AddToCartButton dishID={dish.ID} token={token} />
                        </div>
                    </div>
                ))}
            </div>
            {/* Кнопка для перехода на страницу заказов */}
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <Link to="/orders" style={ordersButtonStyle}>
                    Перейти к заказам
                </Link>
            </div>
        </div>
    );
}

const ordersButtonStyle = {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#28a745",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.2s",
    display: "inline-block",
    marginTop: "1rem",
};

function AddToCartButton({ dishID, token }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const handleAdd = async () => {
        try {
            const res = await fetch(`/api/orders/add/${dishID}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const text = await res.text();
            if (!res.ok) throw new Error(text);
            alert("✅ Добавлено в корзину");
        } catch (err) {
            alert("❌ Ошибка: " + err.message);
        }
    };

    return (
        <button
            onClick={handleAdd}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={() => setIsActive(true)}
            onMouseUp={() => setIsActive(false)}
            style={{
                ...addBtnStyle,
                ...(isHovered ? addBtnHoverStyle : {}),
                ...(isActive ? addBtnActiveStyle : {}),
            }}
        >
            Добавить в корзину
        </button>
    );
}

// Стилизация компонентов
const titleStyle = {
    textAlign: "center",
    fontSize: "2.5rem",
    marginBottom: "2rem",
    marginTop: "-1rem",
};

const categoryStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    marginBottom: "2rem",
};

const catBtn = {
    padding: "0.75rem 1.5rem",
    borderRadius: "30px",
    border: "2px solid #ccc",
    background: "#f5f5f5",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1.1rem",
    transition: "all 0.2s ease",
    ':hover': {
        background: "#e0e0e0",
    },
};

const catBtnActive = {
    background: "#28a745",
    color: "#fff",
    borderColor: "#28a745",
};

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1.5rem",
};

const cardStyle = {
    width: "100%",
    height: "420px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
};

const hoveredCardStyle = {
    transform: "translateY(-5px)",
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
};

const imageStyle = {
    width: "100%",
    height: "160px",
    objectFit: "cover",
};

const infoStyle = {
    padding: "1rem",
};

const linkStyle = {
    textDecoration: "none",
    color: "inherit",
};

const addBtnStyle = {
    marginTop: "0.75rem",
    padding: "0.75rem",
    width: "100%",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.3s, transform 0.2s", // анимация на изменение фона и трансформацию
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "50px", // фиксированная высота кнопки
};

const addBtnHoverStyle = {
    backgroundColor: "#0056b3",
};

const addBtnActiveStyle = {
    transform: "scale(0.95)",
};
