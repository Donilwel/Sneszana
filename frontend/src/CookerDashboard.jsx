import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CookerDashboard = ({ token }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hasFetched, setHasFetched] = useState(false);
    const navigate = useNavigate();

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
            setOrders(data || []);
            setHasFetched(true);
        } catch (err) {
            setError(err.message);
            console.error('Ошибка загрузки заказов:', err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [token]);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
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

            setOrders(prevOrders =>
                (prevOrders || []).map(order =>
                    order.order_id === orderId ? { ...order, status: newStatus } : order
                )
            );
        } catch (err) {
            setError(`Ошибка обновления статуса: ${err.message}`);
            console.error('Ошибка обновления статуса:', err);
        }
    };

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

    const currentOrders = orders || [];

    return (
        <div className="cooker-dashboard">
            <header className="dashboard-header">
                <h1>Панель управления кухней</h1>
            </header>

            <div className="orders-container">
                {hasFetched && currentOrders.length === 0 ? (
                    <div className="no-orders">
                        <p>Нет активных заказов для приготовления</p>
                        <p>Все заказы обработаны!</p>
                    </div>
                ) : (
                    <div className="orders-grid">
                        {currentOrders.map(order => (
                            <div key={order.order_id} className="order-card">
                                <div className="order-header">
                                    <h3>Заказ #{order.order_id?.split('-')[0]}</h3>
                                    <span className={`status-badge ${order.status}`}>
                                        {order.status === 'cooking' ? 'В приготовлении' :
                                            order.status === 'waitfreecourier' ? 'Ожидает курьера' :
                                                order.status === 'cancelled' ? 'Отменен' : order.status}
                                    </span>
                                </div>

                                <div className="order-meta">
                                    <p><strong>Создан:</strong> {formatDate(order.created_at)}</p>
                                    {order.total_price && <p><strong>Сумма:</strong> {order.total_price.toLocaleString('ru-RU')} ₽</p>}
                                </div>

                                <div className="order-items">
                                    <h4>Состав заказа:</h4>
                                    <ul>
                                        {(order.items || []).map((item, index) => (
                                            <li key={`${order.order_id}-${index}`}>
                                                <div className="item-image">
                                                    <img src={item.image_url || 'https://via.placeholder.com/50'} alt={item.dish_name} />
                                                </div>
                                                <div className="item-info">
                                                    <span className="item-name">{item.dish_name}</span>
                                                    <span className="item-price">{item.price?.toLocaleString('ru-RU')} ₽ × {item.count}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="order-actions">
                                    <button
                                        onClick={() => updateOrderStatus(order.order_id, 'waitfreecourier')}
                                        className="action-btn ready-btn"
                                        disabled={order.status !== 'cooking'}
                                    >
                                        Завершить приготовление
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Вы уверены, что хотите отменить этот заказ?')) {
                                                updateOrderStatus(order.order_id, 'cancelled');
                                            }
                                        }}
                                        className="action-btn cancel-btn"
                                        disabled={order.status !== 'cooking'}
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
                    align-items: center;
                    gap: 12px;
                    padding: 10px 0;
                    border-bottom: 1px dashed #eee;
                }
                .item-image {
                    width: 50px;
                    height: 50px;
                    border-radius: 5px;
                    overflow: hidden;
                }
                .item-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .item-info {
                    flex: 1;
                }
                .item-name {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 3px;
                }
                .item-price {
                    color: #666;
                    font-size: 14px;
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
                    background-color: #f8f9fa;
                    border-radius: 10px;
                    color: #6c757d;
                    margin: 20px;
                    border: 1px dashed #dee2e6;
                }
                .no-orders p {
                    margin: 10px 0;
                    font-size: 16px;
                }
                .no-orders p:first-child {
                    font-weight: 500;
                    color: #495057;
                    font-size: 18px;
                }
            `}</style>
        </div>
    );
};

export default CookerDashboard;