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
                            ...(selectedCategory === cat ? catBtnActive : {})
                        }}
                    >
                        {cat[0].toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>
            <div style={gridStyle}>
                {filtered.map((dish) => (
                    <Link to={`/dish/${dish.ID}`} key={dish.ID} style={linkStyle}>
                        <div
                            style={{
                                ...cardStyle,
                                ...(hovered === dish.ID ? hoveredCardStyle : {}),
                            }}
                            onMouseEnter={() => setHovered(dish.ID)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <img
                                src={dish.ImageURL || "https://via.placeholder.com/300x200"}
                                alt={dish.Name}
                                style={imageStyle}
                            />
                            <div style={infoStyle}>
                                <h3>{dish.Name}</h3>
                                <p style={{ fontSize: "0.9rem", color: "#555" }}>{dish.Description}</p>
                                <p style={{ fontWeight: "bold" }}>{dish.Price} ₽</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

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
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    border: "1px solid #ccc",
    background: "#f5f5f5",
    cursor: "pointer",
    fontWeight: "bold",
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
    border: "1px solid #ddd",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
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
