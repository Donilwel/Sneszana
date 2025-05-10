import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CourierOrders = ({ token }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [acceptingOrder, setAcceptingOrder] = useState(false);
    const [modal, setModal] = useState({
        show: false,
        title: '',
        message: '',
        type: 'info', // 'info', 'error', 'success', 'confirm'
        onConfirm: null,
        onCancel: null
    });
    const navigate = useNavigate();

    // Функция для показа модального окна
    const showModal = (title, message, type = 'info', onConfirm = null, onCancel = null) => {
        setModal({
            show: true,
            title,
            message,
            type,
            onConfirm,
            onCancel
        });
    };

    // Функция для скрытия модального окна
    const hideModal = () => {
        setModal({
            show: false,
            title: '',
            message: '',
            type: 'info',
            onConfirm: null,
            onCancel: null
        });
    };

    // Загрузка списка заказов
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError('');

                const res = await fetch('/api/courier/orders', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    let errorMessage = 'Не удалось загрузить список заказов';
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        console.error('Не удалось распарсить ошибку:', e);
                    }

                    throw new Error(errorMessage);
                }

                const data = await res.json();
                setOrders(data);
            } catch (err) {
                console.error('Ошибка при загрузке заказов:', err);
                setError(err.message);
                showModal('Ошибка', `Не удалось загрузить заказы: ${err.message}`, 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [token]);

    // Принять заказ с подтверждением
    const handleAcceptOrder = (orderId) => {
        const order = orders.find(o => o.ID === orderId);

        showModal(
            'Подтверждение',
            `Вы уверены, что хотите принять заказ #${orderId.slice(0, 8)}?`,
            'confirm',
            () => acceptOrder(orderId),
            () => console.log('Отмена принятия заказа')
        );
    };

    // Фактическое принятие заказа
    const acceptOrder = async (orderId) => {
        if (acceptingOrder) return;

        setAcceptingOrder(true);
        hideModal(); // Скрываем модальное окно подтверждения

        try {
            const res = await fetch(`/api/courier/orders/${orderId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            let data;
            try {
                data = await res.json();
            } catch (e) {
                console.error('Не удалось распарсить ответ сервера:', e);
                throw new Error('Неверный формат ответа от сервера');
            }

            if (!res.ok) {
                let errorMessage = data.message || 'Не удалось принять заказ';

                if (data.message) {
                    if (data.message.toLowerCase().includes('уже взят')) {
                        errorMessage = 'Этот заказ уже взят другим курьером';
                    } else if (data.message.toLowerCase().includes('статус')) {
                        errorMessage = 'Ваш статус не позволяет принять заказ';
                    } else if (data.message.toLowerCase().includes('недоступен')) {
                        errorMessage = 'Заказ недоступен для принятия';
                    }
                }

                throw new Error(errorMessage);
            }

            setOrders(prev => prev.filter(order => order.ID !== orderId));
            setSelectedOrder(null);

            showModal('Успех', 'Заказ успешно принят!', 'success', () => {
                navigate('/courier/active-orders');
            });
        } catch (err) {
            console.error('Ошибка при принятии заказа:', err);

            showModal('Ошибка', err.message, 'error');

            if (err.message.includes('уже взят') || err.message.includes('недоступен')) {
                setOrders(prev => prev.filter(order => order.ID !== orderId));
                setSelectedOrder(null);
            }
        } finally {
            setAcceptingOrder(false);
        }
    };

    // Получение читаемого статуса
    const getStatusName = (status) => {
        const statusMap = {
            'waitfreecourier': 'Ожидает курьера',
            'preparing': 'Готовится',
            'ready': 'Готов к доставке',
            'delivering': 'Доставляется',
            'delivered': 'Доставлен',
            'canceled': 'Отменен'
        };
        return statusMap[status] || status;
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        try {
            if (!dateString || dateString === '0001-01-01T00:00:00Z') {
                return 'Не указано';
            }
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? 'Неверная дата' : date.toLocaleString('ru-RU');
        } catch (e) {
            console.error('Ошибка форматирования даты:', e);
            return 'Ошибка даты';
        }
    };

    if (loading) return (
        <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Загрузка данных...</p>
        </div>
    );

    if (error) return (
        <div style={styles.errorContainer}>
            <h3>Произошла ошибка</h3>
            <p>{error}</p>
            <button
                onClick={() => window.location.reload()}
                style={styles.retryButton}
            >
                Попробовать снова
            </button>
        </div>
    );

    return (
        <div style={styles.container}>
            {/* Модальное окно */}
            {modal.show && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={{
                            ...styles.modalHeader,
                            backgroundColor: modal.type === 'error' ? '#f8d7da' :
                                modal.type === 'success' ? '#d4edda' :
                                    modal.type === 'confirm' ? '#cce5ff' : '#e2e3e5'
                        }}>
                            <h3 style={styles.modalTitle}>{modal.title}</h3>
                            <button onClick={hideModal} style={styles.modalCloseButton}>×</button>
                        </div>
                        <div style={styles.modalBody}>
                            <p>{modal.message}</p>
                        </div>
                        <div style={styles.modalFooter}>
                            {modal.type === 'confirm' && (
                                <>
                                    <button
                                        onClick={() => {
                                            if (modal.onConfirm) modal.onConfirm();
                                            hideModal();
                                        }}
                                        style={styles.modalConfirmButton}
                                    >
                                        Подтвердить
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (modal.onCancel) modal.onCancel();
                                            hideModal();
                                        }}
                                        style={styles.modalCancelButton}
                                    >
                                        Отмена
                                    </button>
                                </>
                            )}
                            {modal.type !== 'confirm' && (
                                <button
                                    onClick={() => {
                                        if (modal.onConfirm) modal.onConfirm();
                                        hideModal();
                                    }}
                                    style={styles.modalConfirmButton}
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <header style={styles.header}>
                <h1>Доступные заказы</h1>
                <button
                    onClick={() => navigate('/courier')}
                    style={styles.backButton}
                >
                    ← Назад к профилю
                </button>
            </header>

            {orders.length === 0 && (
                <div style={styles.emptyState}>
                    <h3>Нет доступных заказов</h3>
                    <p>В данный момент нет заказов, ожидающих курьера.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={styles.refreshButton}
                    >
                        Обновить список
                    </button>
                </div>
            )}

            <div style={styles.contentWrapper}>
                <div style={styles.ordersColumn}>
                    {orders.length > 0 && (
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
                                        disabled={order.Status !== 'waitfreecourier' || acceptingOrder}
                                    >
                                        {acceptingOrder ? 'Обработка...' : 'Принять заказ'}
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
                                        {selectedOrder.address.comment && (
                                            <p><strong>Комментарий:</strong> {selectedOrder.address.comment}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p style={styles.noItems}>Адрес доставки не указан</p>
                                )}
                            </div>

                            <button
                                onClick={() => handleAcceptOrder(selectedOrder.ID)}
                                style={styles.acceptButton}
                                disabled={selectedOrder.Status !== 'waitfreecourier' || acceptingOrder}
                            >
                                {acceptingOrder ? 'Обработка...' : 'Принять заказ'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Обновленные стили с модальным окном
const styles = {
    // ... (предыдущие стили остаются без изменений)

    // Стили для модального окна
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        width: '90%',
        maxWidth: '500px',
        overflow: 'hidden'
    },
    modalHeader: {
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #ddd'
    },
    modalTitle: {
        margin: 0,
        fontSize: '20px'
    },
    modalCloseButton: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        padding: '0 10px',
        color: '#666',
        ':hover': {
            color: '#333'
        }
    },
    modalBody: {
        padding: '20px',
        fontSize: '16px',
        lineHeight: '1.5'
    },
    modalFooter: {
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        borderTop: '1px solid #ddd'
    },
    modalConfirmButton: {
        padding: '8px 16px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        ':hover': {
            backgroundColor: '#218838'
        }
    },
    modalCancelButton: {
        padding: '8px 16px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        ':hover': {
            backgroundColor: '#c82333'
        }
    },
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
        textDecoration: 'none',
        ':hover': {
            backgroundColor: '#5a6268'
        }
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
        overflowY: 'auto',
        paddingRight: '10px'
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
        fontWeight: '500',
        display: 'inline-block'
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
        transition: 'background-color 0.2s',
        ':hover:not(:disabled)': {
            backgroundColor: '#218838'
        },
        ':disabled': {
            backgroundColor: '#cccccc',
            cursor: 'not-allowed'
        }
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        textAlign: 'center'
    },
    spinner: {
        border: '4px solid rgba(0, 0, 0, 0.1)',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        borderLeftColor: '#09f',
        animation: 'spin 1s linear infinite',
        marginBottom: '15px'
    },
    errorContainer: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '20px',
        borderRadius: '5px',
        margin: '20px auto',
        maxWidth: '600px',
        textAlign: 'center'
    },
    retryButton: {
        padding: '8px 16px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '15px',
        ':hover': {
            backgroundColor: '#c82333'
        }
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        marginBottom: '30px'
    },
    refreshButton: {
        padding: '8px 16px',
        backgroundColor: '#17a2b8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '15px',
        ':hover': {
            backgroundColor: '#138496'
        }
    }
};

// Получение стилей для статуса
const getStatusStyle = (status) => {
    const statusStyles = {
        'waitfreecourier': { backgroundColor: '#fff3cd', color: '#856404' },
        'preparing': { backgroundColor: '#cce5ff', color: '#004085' },
        'ready': { backgroundColor: '#d4edda', color: '#155724' },
        'delivering': { backgroundColor: '#e2e3e5', color: '#383d41' },
        'delivered': { backgroundColor: '#d1ecf1', color: '#0c5460' },
        'canceled': { backgroundColor: '#f8d7da', color: '#721c24' }
    };
    return statusStyles[status] || { backgroundColor: '#e2e3e5', color: '#383d41' };
};

export default CourierOrders;