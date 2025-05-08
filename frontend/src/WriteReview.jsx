import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function WriteReview({ token }) {  // Получаем token как пропс
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ text_message: "", mark: 5 });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Обработка изменений в полях формы
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "mark" ? parseInt(value) : value,
        }));
    };

    // Отправка отзыва на сервер
    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);

        fetch(`/api/orders/reviews/dish/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,  // Передаем токен в заголовке
            },
            body: JSON.stringify(formData),
        })
            .then((res) => res.json())  // Ожидаем JSON в ответ
            .then((data) => {
                if (data.message) throw new Error(data.message); // Если ошибка на сервере
                navigate(`/dish/${id}/reviews`);  // Перенаправление на страницу с отзывами
            })
            .catch((err) => setError(err.message))  // Обработка ошибок
            .finally(() => setSubmitting(false));  // Снимаем индикатор отправки
    };

    return (
        <div style={containerStyle}>
            <h2>Написать отзыв</h2>
            <form onSubmit={handleSubmit} style={formStyle}>
                <textarea
                    name="text_message"
                    value={formData.text_message}
                    onChange={handleInputChange}
                    placeholder="Напишите ваш отзыв о блюде"
                    required
                    style={textareaStyle}
                />
                <div style={ratingStyle}>
                    <label htmlFor="mark">Оценка:</label>
                    <select
                        name="mark"
                        value={formData.mark}
                        onChange={handleInputChange}
                        required
                        style={selectStyle}
                    >
                        {[5, 4, 3, 2, 1].map((num) => (
                            <option key={num} value={num}>
                                {num} ★
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" disabled={submitting} style={submitButtonStyle}>
                    {submitting ? "Отправка..." : "Отправить отзыв"}
                </button>
            </form>
            {error && <p style={errorStyle}>{error}</p>} {/* Выводим ошибку, если есть */}
        </div>
    );
}

const containerStyle = {
    maxWidth: "700px",
    margin: "2rem auto",
    padding: "1rem",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
};

const formStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
};

const textareaStyle = {
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem",
    resize: "vertical",
    minHeight: "120px",
    fontFamily: "'Poppins', sans-serif",
    transition: "border-color 0.3s ease",
};

const selectStyle = {
    padding: "0.5rem",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "1rem",
    fontFamily: "'Poppins', sans-serif",
    transition: "border-color 0.3s ease",
};

const ratingStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
};

const submitButtonStyle = {
    padding: "1rem 2rem",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.3s ease",
};

const errorStyle = {
    color: "red",
    fontSize: "1rem",
    fontWeight: "bold",
};
