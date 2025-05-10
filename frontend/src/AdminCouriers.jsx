import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminCouriers = ({ token }) => {
    const [couriers, setCouriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchCouriers = async () => {
            try {
                setLoading(true);
                let url = '/api/admin/couriers';
                if (filter !== 'all') {
                    url += `?status=${filter}`;
                }

                const res = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Ожидался JSON, но получен ' + contentType);
                }

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Ошибка при загрузке курьеров');
                }

                if (data.length === 0) {
                    setError('Курьеров не найдено');
                } else {
                    setCouriers(data);
                    setError('');
                }
            } catch (err) {
                console.error('Ошибка загрузки:', err);
                setError(err.message || 'Произошла ошибка при загрузке курьеров');
            } finally {
                setLoading(false);
            }
        };

        fetchCouriers();
    }, [token, filter]);

    const renderStatus = (status) => {
        const statusMap = {
            'ACTIVE': { text: 'Активен', color: '#28a745', bg: '#d4edda' },
            'UNACTIVE': { text: 'Неактивен', color: '#6c757d', bg: '#e2e3e5' },
            'BLOCKED': { text: 'Заблокирован', color: '#dc3545', bg: '#f8d7da' }
        };

        const statusInfo = statusMap[status] || { text: status, color: '#000', bg: '#fff' };

        return (
            <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: statusInfo.bg,
                color: statusInfo.color
            }}>
                {statusInfo.text}
            </span>
        );
    };

    const renderVehicle = (vehicle) => {
        const vehicleMap = {
            'NONE': 'Нет',
            'BICYCLE': 'Велосипед',
            'SCOOTER': 'Самокат',
            'CAR': 'Автомобиль',
            'MOTORCYCLE': 'Мотоцикл'
        };

        return vehicleMap[vehicle] || vehicle;
    };

    if (loading) return <div style={styles.loading}>Загрузка курьеров...</div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Управление курьерами</h1>

            <div style={styles.controls}>
                <div style={styles.filterContainer}>
                    <label style={styles.filterLabel}>Фильтр по статусу:</label>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={styles.select}
                    >
                        <option value="all">Все курьеры</option>
                        <option value="ACTIVE">Активные</option>
                        <option value="UNACTIVE">Неактивные</option>
                        <option value="BLOCKED">Заблокированные</option>
                    </select>
                </div>

                <Link to="/admin" style={styles.backLink}>
                    ← Назад в админ-панель
                </Link>
            </div>

            {error && <div style={styles.error}>Ошибка: {error}</div>}

            {!error && couriers.length === 0 ? (
                <div style={styles.empty}>Курьеров не найдено</div>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                        <tr style={styles.headerRow}>
                            {['ID', 'Имя', 'Email', 'Телефон', 'Рейтинг', 'Транспорт', 'Заказов', 'Статус', 'Дата регистрации'].map((header) => (
                                <th key={header} style={styles.th}>{header}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {couriers.map((courier) => (
                            <tr key={courier.ID} style={styles.row}>
                                <td style={styles.td}>{courier.ID}</td>
                                <td style={styles.td}>{courier.User.Name}</td>
                                <td style={styles.td}>{courier.User.Email}</td>
                                <td style={styles.td}>{courier.User.PhoneNumber}</td>
                                <td style={styles.td}>{courier.Rating}</td>
                                <td style={styles.td}>{renderVehicle(courier.Vehicle)}</td>
                                <td style={styles.td}>{courier.OrdersCount}</td>
                                <td style={styles.td}>{renderStatus(courier.Status)}</td>
                                <td style={styles.td}>
                                    {new Date(courier.CreatedAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
    },
    header: {
        marginBottom: '30px',
        color: '#333',
        textAlign: 'center'
    },
    controls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
    },
    filterContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    filterLabel: {
        fontWeight: '500'
    },
    select: {
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        cursor: 'pointer'
    },
    backLink: {
        color: '#6c757d',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px'
    },
    tableContainer: {
        overflowX: 'auto',
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
        borderRadius: '8px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '800px'
    },
    headerRow: {
        backgroundColor: '#f8f9fa'
    },
    th: {
        padding: '12px 15px',
        textAlign: 'left',
        fontWeight: '600'
    },
    row: {
        borderBottom: '1px solid #eee'
    },
    td: {
        padding: '12px 15px',
        verticalAlign: 'middle'
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        fontSize: '18px',
        color: '#666'
    },
    error: {
        padding: '20px',
        color: '#dc3545',
        textAlign: 'center',
        backgroundColor: '#f8d7da',
        borderRadius: '4px',
        margin: '20px'
    },
    empty: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '18px',
        color: '#666',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
    }
};

export default AdminCouriers;