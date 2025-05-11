import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ratingModal, setRatingModal] = useState({ show: false, orderId: null, rating: 0 });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return "Invalid Date";
        }
        return date.toLocaleDateString();
    };

    const formatPrice = (price) => {
        return price ? `${price} ₽` : "Цена не указана";
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch('/api/orders/', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch orders');
                }
                const data = await response.json();
                setOrders(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const handleDeleteOrder = async (orderId) => {
        if (window.confirm("Вы уверены, что хотите удалить этот заказ?")) {
            try {
                const res = await fetch(`/api/orders/${orderId}`, {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || "Не удалось удалить заказ");
                }

                setOrders(orders.filter((order) => order.ID !== orderId));
                alert("✅ Заказ успешно удален");
            } catch (err) {
                alert("❌ Ошибка: " + err.message);
            }
        }
    };

    const handleRateCourier = (orderId) => {
        setRatingModal({ show: true, orderId, rating: 0 });
    };

    const submitCourierRating = async () => {
        try {
            const response = await fetch(`/api/orders/${ratingModal.orderId}/rate-courier`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ rating: ratingModal.rating })
            });

            if (!response.ok) {
                throw new Error('Не удалось отправить оценку');
            }

            alert('✅ Оценка курьера сохранена');
            setRatingModal({ show: false, orderId: null, rating: 0 });

            // Обновляем список заказов
            const updatedOrders = orders.map(order =>
                order.ID === ratingModal.orderId ? { ...order, courierRated: true } : order
            );
            setOrders(updatedOrders);
        } catch (err) {
            alert('❌ Ошибка: ' + err.message);
        }
    };

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    return (
        <div style={containerStyle}>
            <h2>Мои заказы</h2>
            {orders.length === 0 ? (
                <p>Заказов не найдено</p>
            ) : (
                <ul style={ordersListStyle}>
                    {orders.map((order) => (
                        <li key={order.ID} style={orderItemStyle}>
                            <div>
                                <strong>Заказ #{order.ID}</strong>
                            </div>
                            <div>Дата создания: {formatDate(order.CreatedAt)}</div>
                            <div>Статус: {order.Status || "Статус недоступен"}</div>
                            <div>Общая стоимость: {formatPrice(order.Price)}</div>

                            <div style={buttonContainerStyle}>
                                <Link to={`/order/${order.ID}`} style={buttonStyle}>
                                    Просмотреть заказ
                                </Link>
                                {order.Status === 'created' && (
                                    <button
                                        onClick={() => handleDeleteOrder(order.ID)}
                                        style={deleteButtonStyle}
                                    >
                                        Удалить заказ
                                    </button>
                                )}
                                {order.Status === 'closed' && !order.courierRated && (
                                    <button
                                        onClick={() => handleRateCourier(order.ID)}
                                        style={rateButtonStyle}
                                    >
                                        Оценить курьера
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Модальное окно оценки курьера */}
            {ratingModal.show && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3>Оцените работу курьера</h3>
                        <p>Выберите оценку от 1 до 5 звезд:</p>

                        <div style={starsContainerStyle}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    style={{
                                        ...starStyle,
                                        color: star <= ratingModal.rating ? '#FFD700' : '#ccc',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setRatingModal({...ratingModal, rating: star})}
                                >
                                    ★
                                </span>
                            ))}
                        </div>

                        <div style={modalButtonContainerStyle}>
                            <button
                                onClick={() => setRatingModal({ show: false, orderId: null, rating: 0 })}
                                style={modalCancelButtonStyle}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={submitCourierRating}
                                disabled={ratingModal.rating === 0}
                                style={modalSubmitButtonStyle}
                            >
                                Отправить оценку
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Стили
const containerStyle = {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
};

const ordersListStyle = {
    listStyleType: 'none',
    padding: 0,
};

const orderItemStyle = {
    padding: '1rem',
    margin: '1rem 0',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    textAlign: 'left',
};

const buttonContainerStyle = {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
};

const buttonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'inline-block',
};

const deleteButtonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
};

const rateButtonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    backgroundColor: '#ffc107',
    color: '#000',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
};

// Стили для модального окна
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
};

const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
};

const starsContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    margin: '1.5rem 0',
    fontSize: '2rem',
};

const starStyle = {
    fontSize: '2.5rem',
    transition: 'color 0.2s',
};

const modalButtonContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
};

const modalCancelButtonStyle = {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
};

const modalSubmitButtonStyle = {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    opacity: 1,
    transition: 'opacity 0.2s',
};