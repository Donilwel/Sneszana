import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CourierOrders = ({ token }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const navigate = useNavigate();

    // Загрузка списка заказов
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/courier/orders', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error('Не удалось загрузить список заказов');
                }

                const data = await res.json();
                setOrders(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [token]);

    // Принять заказ
    const handleAcceptOrder = async (orderId) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                throw new Error('Не удалось принять заказ');
            }

            const updatedOrders = orders.filter(order => order.ID !== orderId);
            setOrders(updatedOrders);
            setSelectedOrder(null);
            alert('Заказ успешно принят!');
        } catch (err) {
            setError(err.message);
        }
    };

    // Получение читаемого статуса
    const getStatusName = (status) => {
        switch(status) {
            case 'waitfreecourier': return 'Ожидает курьера';
            case 'preparing': return 'Готовится';
            case 'ready': return 'Готов к доставке';
            case 'delivering': return 'Доставляется';
            case 'delivered': return 'Доставлен';
            case 'canceled': return 'Отменен';
            default: return status;
        }
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        if (!dateString || dateString === '0001-01-01T00:00:00Z') {
            return 'Не указано';
        }
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    };

    if (loading) return <div style={styles.loading}>Загрузка заказов...</div>;
    if (error) return <div style={styles.error}>Ошибка: {error}</div>;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>Доступные заказы</h1>
                <button
                    onClick={() => navigate('/courier')}
                    style={styles.backButton}
                >
                    ← Назад к профилю
                </button>
            </header>

            <div style={styles.contentWrapper}>
                <div style={styles.ordersColumn}>
                    {orders.length === 0 ? (
                        <div style={styles.emptyMessage}>Нет доступных заказов</div>
                    ) : (
                        <div style={styles.ordersList}>
                            {orders.map(order => (
                                <div
                                    key={order.ID}
                                    style={{
                                        ...styles.orderCard,
                                        ...(selectedOrder?.ID === order.ID ? styles.selectedOrder : {})
                                    }}
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <div style={styles.orderHeader}>
                                        <h3>Заказ #{order.ID.slice(0, 8)}</h3>
                                        <span style={{
                                            ...styles.statusBadge,
                                            ...getStatusStyle(order.Status)
                                        }}>
                                            {getStatusName(order.Status)}
                                        </span>
                                    </div>

                                    <div style={styles.orderDetails}>
                                        <p><strong>Создан:</strong> {formatDate(order.CreatedAt)}</p>
                                        <p><strong>Сумма:</strong> {order.Price} ₽</p>
                                        <p><strong>Позиций:</strong> {order.OrderItems?.length || 0}</p>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAcceptOrder(order.ID);
                                        }}
                                        style={styles.acceptButton}
                                        disabled={order.Status !== 'waitfreecourier'}
                                    >
                                        Принять заказ
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedOrder && (
                    <div style={styles.detailsColumn}>
                        <div style={styles.detailsCard}>
                            <h2 style={styles.detailsTitle}>Детали заказа #{selectedOrder.ID.slice(0, 8)}</h2>

                            <div style={styles.detailsSection}>
                                <h3 style={styles.sectionTitle}>Информация</h3>
                                <p><strong>Статус:</strong> <span style={{
                                    ...styles.statusBadge,
                                    ...getStatusStyle(selectedOrder.Status)
                                }}>{getStatusName(selectedOrder.Status)}</span></p>
                                <p><strong>Создан:</strong> {formatDate(selectedOrder.CreatedAt)}</p>
                                <p><strong>Обновлен:</strong> {formatDate(selectedOrder.UpdatedAt)}</p>
                                <p><strong>Сумма:</strong> {selectedOrder.Price} ₽</p>
                            </div>

                            <div style={styles.detailsSection}>
                                <h3 style={styles.sectionTitle}>Состав заказа</h3>
                                {selectedOrder.items?.length > 0 ? (
                                    <div style={styles.itemsTable}>
                                        <div style={styles.tableHeader}>
                                            <div style={styles.nameCol}>Название</div>
                                            <div style={styles.quantityCol}>Кол-во</div>
                                            <div style={styles.priceCol}>Цена</div>
                                        </div>
                                        {selectedOrder.items.map((item) => (
                                            <div key={item.order_item.ID} style={styles.tableRow}>
                                                <div style={styles.nameCol}>
                                                    {item.dish?.Name || `Позиция #${item.order_item.ID.slice(0, 4)}`}
                                                </div>
                                                <div style={styles.quantityCol}>
                                                    {item.order_item.Count}
                                                </div>
                                                <div style={styles.priceCol}>
                                                    {item.dish?.Price ? `${item.dish.Price} ₽` : '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={styles.noItems}>Состав заказа не указан</p>
                                )}
                            </div>

                            <div style={styles.detailsSection}>
                                <h3 style={styles.sectionTitle}>Адрес доставки</h3>
                                {selectedOrder.address ? (
                                    <div style={styles.addressDetails}>
                                        <p><strong>Улица:</strong> {selectedOrder.address.street}</p>
                                    </div>
                                ) : (
                                    <p style={styles.noItems}>Адрес доставки не указан</p>
                                )}
                            </div>

                            <button
                                onClick={() => handleAcceptOrder(selectedOrder.ID)}
                                style={styles.acceptButton}
                                disabled={selectedOrder.Status !== 'waitfreecourier'}
                            >
                                Принять заказ
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Стили
const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '1px solid #eee',
        paddingBottom: '15px'
    },
    backButton: {
        padding: '8px 16px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        textDecoration: 'none'
    },
    contentWrapper: {
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '30px',
        '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr'
        }
    },
    ordersColumn: {
        maxHeight: '80vh',
        overflowY: 'auto'
    },
    detailsColumn: {
        position: 'sticky',
        top: '20px',
        height: 'fit-content'
    },
    ordersList: {
        display: 'grid',
        gap: '15px'
    },
    orderCard: {
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
        }
    },
    selectedOrder: {
        border: '2px solid #007bff',
        backgroundColor: '#e7f1ff'
    },
    orderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
    },
    orderDetails: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '15px',
        fontSize: '14px'
    },
    statusBadge: {
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500'
    },
    detailsCard: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    detailsTitle: {
        marginTop: 0,
        marginBottom: '20px',
        color: '#333'
    },
    detailsSection: {
        marginBottom: '20px'
    },
    sectionTitle: {
        fontSize: '18px',
        marginBottom: '10px',
        color: '#555'
    },
    itemsTable: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px'
    },
    tableHeader: {
        display: 'flex',
        padding: '8px 0',
        borderBottom: '1px solid #ddd',
        fontWeight: 'bold',
        textAlign: 'left'
    },
    tableRow: {
        display: 'flex',
        padding: '8px 0',
        borderBottom: '1px solid #eee',
        alignItems: 'center'
    },
    nameCol: {
        flex: '3',
        paddingRight: '10px'
    },
    quantityCol: {
        flex: '1',
        textAlign: 'center'
    },
    priceCol: {
        flex: '1',
        textAlign: 'right'
    },
    noItems: {
        color: '#666',
        fontStyle: 'italic'
    },
    addressDetails: {
        backgroundColor: '#f0f0f0',
        padding: '15px',
        borderRadius: '5px',
        marginTop: '10px'
    },
    acceptButton: {
        padding: '10px 20px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        width: '100%',
        marginTop: '15px',
        ':disabled': {
            backgroundColor: '#cccccc',
            cursor: 'not-allowed'
        }
    },
    emptyMessage: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '18px',
        color: '#666'
    },
    loading: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '18px',
        color: '#666'
    },
    error: {
        color: '#dc3545',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8d7da',
        borderRadius: '4px',
        margin: '20px'
    }
};

// Получение стилей для статуса
const getStatusStyle = (status) => {
    switch(status) {
        case 'waitfreecourier': return { backgroundColor: '#fff3cd', color: '#856404' };
        case 'preparing': return { backgroundColor: '#cce5ff', color: '#004085' };
        case 'ready': return { backgroundColor: '#d4edda', color: '#155724' };
        case 'delivering': return { backgroundColor: '#e2e3e5', color: '#383d41' };
        case 'delivered': return { backgroundColor: '#d1ecf1', color: '#0c5460' };
        case 'canceled': return { backgroundColor: '#f8d7da', color: '#721c24' };
        default: return { backgroundColor: '#e2e3e5', color: '#383d41' };
    }
};

export default CourierOrders;