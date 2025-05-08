import React from "react";

function DeleteOrderButton({ orderId, token, onDeleteSuccess }) {
    const handleDelete = async () => {
        if (!window.confirm("Вы уверены, что хотите удалить заказ?")) return;

        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            alert("✅ Заказ удален успешно");
            onDeleteSuccess(); // Обновить состояние после удаления
        } catch (err) {
            alert("❌ Ошибка: " + err.message);
        }
    };

    return (
        <button onClick={handleDelete} style={deleteBtnStyle}>
            Удалить заказ
        </button>
    );
}

const deleteBtnStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "30px",
    border: "2px solid #f44336",
    backgroundColor: "#f44336",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1.1rem",
    transition: "all 0.2s ease",
};

export default DeleteOrderButton;
