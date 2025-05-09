import { useEffect, useState } from "react";
import { getDishes } from "./api";
import { Link } from "react-router-dom";

export default function AdminDishes({ token }) {
    const [dishes, setDishes] = useState([]);
    const [error, setError] = useState("");
    const [hovered, setHovered] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [editingId, setEditingId] = useState(null);
    const [newPrice, setNewPrice] = useState("");

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

    const handleDelete = async (id) => {
        if (!window.confirm("Вы уверены, что хотите удалить это блюдо?")) return;

        try {
            const res = await fetch(`/api/admin/dishes/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error("Ошибка при удалении");
            setDishes(dishes.filter(dish => dish.ID !== id));
            alert("Блюдо успешно удалено");
        } catch (err) {
            alert("Ошибка: " + err.message);
        }
    };

    const handlePriceUpdate = async (id) => {
        if (!newPrice || isNaN(newPrice)) {
            alert("Пожалуйста, введите корректную цену");
            return;
        }

        try {
            const res = await fetch(`/api/admin/dishes/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ price: parseFloat(newPrice) }),
            });
            if (!res.ok) throw new Error("Ошибка при обновлении цены");

            setDishes(dishes.map(dish =>
                dish.ID === id ? { ...dish, Price: newPrice } : dish
            ));
            setEditingId(null);
            setNewPrice("");
            alert("Цена успешно обновлена");
        } catch (err) {
            alert("Ошибка: " + err.message);
        }
    };

    const startEditing = (id, currentPrice) => {
        setEditingId(id);
        setNewPrice(currentPrice);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setNewPrice("");
    };

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (dishes.length === 0) return <p>Загрузка меню...</p>;

    return (
        <div style={{ padding: "2rem" }}>
            <h2 style={titleStyle}>🍽 Управление меню (Админ)</h2>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <Link to="/admin/dishes/new" style={addDishButtonStyle}>
                    + Добавить новое блюдо
                </Link>
            </div>
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

                            {editingId === dish.ID ? (
                                <div style={editPriceContainer}>
                                    <input
                                        type="number"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        style={priceInputStyle}
                                        placeholder="Новая цена"
                                    />
                                    <div style={editButtonsContainer}>
                                        <button
                                            onClick={() => handlePriceUpdate(dish.ID)}
                                            style={saveButtonStyle}
                                        >
                                            Сохранить
                                        </button>
                                        <button
                                            onClick={cancelEditing}
                                            style={cancelButtonStyle}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={priceContainer}>
                                    <p style={{ fontWeight: "bold" }}>{dish.Price} ₽</p>
                                    <button
                                        onClick={() => startEditing(dish.ID, dish.Price)}
                                        style={editButtonStyle}
                                    >
                                        Изменить
                                    </button>
                                </div>
                            )}

                            <div style={adminButtonsContainer}>
                                <button
                                    onClick={() => handleDelete(dish.ID)}
                                    style={deleteButtonStyle}
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Стили
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
    flexWrap: "wrap",
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
    height: "480px",
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
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
};

const linkStyle = {
    textDecoration: "none",
    color: "inherit",
};

const addDishButtonStyle = {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#007bff",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
    display: "inline-block",
    marginBottom: "1rem",
};

const priceContainer = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "0.5rem 0",
};

const editButtonStyle = {
    padding: "0.3rem 0.6rem",
    backgroundColor: "#ffc107",
    color: "#212529",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.8rem",
};

const editPriceContainer = {
    margin: "0.5rem 0",
};

const priceInputStyle = {
    width: "100%",
    padding: "0.5rem",
    marginBottom: "0.5rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
};

const editButtonsContainer = {
    display: "flex",
    gap: "0.5rem",
};

const saveButtonStyle = {
    padding: "0.3rem 0.6rem",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    flex: 1,
};

const cancelButtonStyle = {
    padding: "0.3rem 0.6rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    flex: 1,
};

const adminButtonsContainer = {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
};

const deleteButtonStyle = {
    padding: "0.5rem",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
};