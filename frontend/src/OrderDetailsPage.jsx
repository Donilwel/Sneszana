import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function OrderDetailsPage({ token }) {
    const { orderId } = useParams();
    const [orderDetails, setOrderDetails] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Ошибка загрузки заказа");
                setOrderDetails(data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchOrderDetails();
    }, [orderId, token]);

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!orderDetails) return <p>Загрузка данных...</p>;

    return (
        <div style={{ padding: "2rem" }}>
            <h2 style={titleStyle}>Информация о заказе #{orderId}</h2>
            <div style={gridStyle}>
                {orderDetails["all dishes"].map((item) => (
                    <div key={item.dish.ID} style={cardStyle}>
                        <img
                            src={item.dish.ImageURL || "https://via.placeholder.com/300x200"}
                            alt={item.dish.Name}
                            style={imageStyle}
                        />
                        <div style={infoStyle}>
                            <h3>{item.dish.Name}</h3>
                            <p>{item.dish.Description}</p>
                            <p><strong>Цена: </strong>{item.dish.Price} ₽</p>
                            <p><strong>Количество: </strong>{item.count}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div style={totalStyle}>
                <p><strong>Общая сумма: </strong>{orderDetails["total price"]} ₽</p>
            </div>
        </div>
    );
}

const titleStyle = {
    textAlign: "center",
    fontSize: "2.5rem",
    marginBottom: "2rem",
};

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1.5rem",
};

const cardStyle = {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "1rem",
};

const imageStyle = {
    width: "100%",
    height: "160px",
    objectFit: "cover",
};

const infoStyle = {
    padding: "1rem",
};

const totalStyle = {
    textAlign: "center",
    marginTop: "2rem",
    fontSize: "1.5rem",
    fontWeight: "bold",
};
