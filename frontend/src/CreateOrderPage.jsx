import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateOrderPage({ token }) {
    const [formData, setFormData] = useState({
        phone: "",
        street: "",
        house_number: "",
        apartment: "",
        domophone_code: ""
    });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/orders/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Ошибка при создании заказа");

            setSuccess({
                message: data.message,
                code: data.code
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div style={containerStyle}>
                <div style={successCardStyle}>
                    <h2 style={titleStyle}>Заказ принят!</h2>
                    <p style={successTextStyle}>{success.message}</p>
                    <div style={codeContainerStyle}>
                        <p style={codeLabelStyle}>Ваш код:</p>
                        <p style={codeStyle}>{success.code}</p>
                    </div>
                    <button
                        onClick={() => navigate("/orders")}
                        style={buttonStyle}
                    >
                        Перейти к моим заказам
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <h2 style={titleStyle}>Оформление заказа</h2>
            <form onSubmit={handleSubmit} style={formStyle}>
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Телефон</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+7 999 123 45 67"
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Улица</label>
                    <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="Махачкалинская"
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Номер дома</label>
                    <input
                        type="text"
                        name="house_number"
                        value={formData.house_number}
                        onChange={handleChange}
                        placeholder="312"
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Квартира</label>
                    <input
                        type="text"
                        name="apartment"
                        value={formData.apartment}
                        onChange={handleChange}
                        placeholder="13"
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Код домофона</label>
                    <input
                        type="text"
                        name="domophone_code"
                        value={formData.domophone_code}
                        onChange={handleChange}
                        placeholder="44553"
                        required
                        style={inputStyle}
                    />
                </div>

                {error && <p style={errorStyle}>{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={buttonStyle}
                >
                    {isSubmitting ? "Оформляем..." : "Оформить заказ"}
                </button>
            </form>
        </div>
    );
}

// Стили
const containerStyle = {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "2rem",
};

const titleStyle = {
    textAlign: "center",
    fontSize: "2rem",
    marginBottom: "2rem",
    color: "#333",
};

const formStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};

const formGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
};

const labelStyle = {
    fontSize: "1rem",
    fontWeight: "500",
    color: "#555",
};

const inputStyle = {
    padding: "0.8rem",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "1rem",
};

const buttonStyle = {
    padding: "1rem",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
};

const errorStyle = {
    color: "red",
    textAlign: "center",
    margin: "1rem 0",
};

const successCardStyle = {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    textAlign: "center",
};

const successTextStyle = {
    fontSize: "1.1rem",
    marginBottom: "1.5rem",
    color: "#333",
};

const codeContainerStyle = {
    margin: "2rem 0",
    padding: "1.5rem",
    backgroundColor: "#f5f5f5",
    borderRadius: "5px",
};

const codeLabelStyle = {
    fontSize: "1rem",
    color: "#666",
    marginBottom: "0.5rem",
};

const codeStyle = {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#4CAF50",
};