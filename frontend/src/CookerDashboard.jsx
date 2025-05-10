import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CookerDashboard = ({ token }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Функция загрузки заказов
    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/kitchen/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setOrders(data.filter(order => order.Status === 'cooking'));
        } catch (err) {
            setError(err.message);
            console.error('Ошибка загрузки заказов:', err);
        } finally {
            setLoading(false);
        }
    };

    // Первоначальная загрузка и интервал обновления
    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [token]);

    // Изменение статуса заказа
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            // Исправлено: используем query параметр вместо тела запроса
            const response = await fetch(`/api/kitchen/${orderId}?status=${newStatus}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedOrder = await response.json();

            // Обновляем локальное состояние
            setOrders(orders.map(order =>
                order.ID === orderId ? updatedOrder : order
            ));
        } catch (err) {
            setError(`Ошибка обновления статуса: ${err.message}`);
            console.error('Ошибка обновления статуса:', err);
        }
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        try {
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return new Date(dateString).toLocaleString('ru-RU', options);
        } catch {
            return 'Дата не указана';
        }
    };

    // Выход из системы
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner"></div>
            <p>Загрузка заказов...</p>
        </div>
    );

    if (error) return (
        <div className="error-screen">
            <p>{error}</p>
            <button onClick={fetchOrders}>Повторить попытку</button>
        </div>
    );

    return (
        <div className="cooker-dashboard">
            <header className="dashboard-header">
                <h1>Панель управления кухней</h1>
                <div className="header-controls">
                    <button
                        onClick={fetchOrders}
                        className="refresh-btn"
                        title="Обновить список"
                    >
                        ⟳
                    </button>
                    <button
                        onClick={handleLogout}
                        className="logout-btn"
                    >
                        Выйти
                    </button>
                </div>
            </header>

            <div className="orders-container">
                {orders.length === 0 ? (
                    <div className="no-orders">
                        <p>Нет активных заказов для приготовления</p>
                    </div>
                ) : (
                    <div className="orders-grid">
                        {orders.map(order => (
                            <div key={order.ID} className="order-card">
                                <div className="order-header">
                                    <h3>Заказ #{order.ID.split('-')[0]}</h3>
                                    <span className={`status-badge ${order.Status}`}>
                                        {order.Status === 'cooking' ? 'В приготовлении' :
                                            order.Status === 'wait_free_courier' ? 'Ожидает курьера' :
                                                order.Status === 'canceled' ? 'Отменен' : order.Status}
                                    </span>
                                </div>

                                <div className="order-meta">
                                    <p><strong>Создан:</strong> {formatDate(order.CreatedAt)}</p>
                                    <p><strong>Обновлен:</strong> {formatDate(order.UpdatedAt)}</p>
                                    {order.Price && <p><strong>Сумма:</strong> {order.Price.toLocaleString()} ₽</p>}
                                </div>

                                <div className="order-items">
                                    <h4>Состав заказа:</h4>
                                    <ul>
                                        {order.OrderItems && order.OrderItems.map(item => (
                                            <li key={item.ID}>
                                                <span className="item-name">Блюдо #{item.DishID?.split('-')[0] || 'N/A'}</span>
                                                <span className="item-count">×{item.Count}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="order-actions">
                                    <button
                                        onClick={() => updateOrderStatus(order.ID, 'waitfreecourier')}
                                        className="action-btn ready-btn"
                                        disabled={order.Status !== 'cooking'}
                                    >
                                        Завершить приготовление
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Вы уверены, что хотите отменить этот заказ?')) {
                                                updateOrderStatus(order.ID, 'cancelled');
                                            }
                                        }}
                                        className="action-btn cancel-btn"
                                        disabled={order.Status !== 'cooking'}
                                    >
                                        Отменить заказ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .cooker-dashboard {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    color: #333;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eaeaea;
                }

                .header-controls {
                    display: flex;
                    gap: 15px;
                }

                .refresh-btn {
                    padding: 8px 12px;
                    background: #f0f0f0;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.2s;
                }

                .refresh-btn:hover {
                    background: #e0e0e0;
                    transform: rotate(90deg);
                }

                .logout-btn {
                    padding: 8px 16px;
                    background-color: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .logout-btn:hover {
                    background-color: #cc0000;
                }

                .orders-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                    gap: 25px;
                }

                .order-card {
                    border: 1px solid #e0e0e0;
                    border-radius: 10px;
                    padding: 20px;
                    background: white;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.08);
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .order-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }

                .order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #f5f5f5;
                }

                .order-header h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 18px;
                }

                .status-badge {
                    padding: 5px 12px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .status-badge.cooking {
                    background-color: #fff8e1;
                    color: #ff8f00;
                }

                .status-badge.wait_free_courier {
                    background-color: #e3f2fd;
                    color: #1976d2;
                }

                .status-badge.canceled {
                    background-color: #ffebee;
                    color: #d32f2f;
                }

                .order-meta {
                    margin-bottom: 15px;
                }

                .order-meta p {
                    margin: 5px 0;
                    font-size: 14px;
                    color: #555;
                }

                .order-items {
                    margin: 20px 0;
                }

                .order-items h4 {
                    margin: 0 0 10px 0;
                    font-size: 16px;
                    color: #333;
                }

                .order-items ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .order-items li {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px dashed #eee;
                }

                .item-name {
                    font-weight: 500;
                }

                .item-count {
                    color: #666;
                }

                .order-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }

                .action-btn {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .ready-btn {
                    background-color: #4caf50;
                    color: white;
                }

                .ready-btn:not(:disabled):hover {
                    background-color: #3d8b40;
                }

                .cancel-btn {
                    background-color: #f44336;
                    color: white;
                }

                .cancel-btn:not(:disabled):hover {
                    background-color: #d32f2f;
                }

                .loading-screen {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 60vh;
                }

                .spinner {
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-radius: 50%;
                    border-top: 4px solid #3498db;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .error-screen {
                    text-align: center;
                    padding: 40px;
                    color: #d32f2f;
                    background-color: #ffebee;
                    border-radius: 5px;
                    margin: 20px;
                }

                .error-screen button {
                    margin-top: 15px;
                    padding: 8px 16px;
                    background-color: #d32f2f;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .no-orders {
                    text-align: center;
                    padding: 40px;
                    background-color: #f5f5f5;
                    border-radius: 5px;
                    color: #666;
                }
            `}</style>
        </div>
    );
};

export default CookerDashboard;