import { useEffect, useState } from "react";
import { getDishes } from "./api";

export default function Dishes({ token }) {
    const [dishes, setDishes] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getDishes(token);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || "Failed to fetch dishes");
                }
                const data = await res.json();
                setDishes(data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchData();
    }, [token]);

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (dishes.length === 0) return <p>Loading dishes...</p>;

    return (
        <div style={{ padding: "2rem" }}>
            <h2 style={{ textAlign: "center" }}>🍽 Меню ресторана</h2>
            <div style={gridStyle}>
                {dishes.map((dish) => (
                    <div key={dish.ID} style={cardStyle}>
                        <img
                            src={dish.ImageURL || "https://via.placeholder.com/300x200"}
                            alt={dish.Name}
                            style={imageStyle}
                        />
                        <div style={infoStyle}>
                            <h3 style={{ margin: "0 0 0.5rem 0" }}>{dish.Name}</h3>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "#555" }}>{dish.Description}</p>
                            <p style={{ fontWeight: "bold", marginTop: "0.5rem" }}>{dish.Price} ₽</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

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
};

const imageStyle = {
    width: "100%",
    height: "160px",
    objectFit: "cover",
};

const infoStyle = {
    padding: "1rem",
};
