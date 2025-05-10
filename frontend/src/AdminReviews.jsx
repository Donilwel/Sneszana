import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminReviews = ({ token }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    // Функция загрузки отзывов с обработкой ошибок
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                let url = '/api/admin/reviews';
                if (filter !== 'all') {
                    url += `?status=${filter}`;
                }

                const res = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Проверяем Content-Type перед парсингом
                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Ожидался JSON, но получен ' + contentType);
                }

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Ошибка при загрузке отзывов');
                }

                if (data.length === 0) {
                    setError('Отзывов не найдено');
                } else {
                    setReviews(data);
                    setError('');
                }
            } catch (err) {
                console.error('Ошибка загрузки:', err);
                setError(err.message || 'Произошла ошибка при загрузке отзывов');
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [token, filter]);

    // Обработчик изменения статуса с улучшенной обработкой ошибок
    const handleStatusChange = async (reviewId, newStatus) => {
        try {
            const res = await fetch(`/api/admin/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Ошибка обновления статуса');
            }

            setReviews(reviews.map(review =>
                review.id === reviewId ? { ...review, status: newStatus } : review
            ));
        } catch (err) {
            console.error('Ошибка обновления:', err);
            setError(err.message);
        }
    };

    // Рендер компонентов
    const renderStars = (rating) => (
        <div style={{ color: '#ffc107', fontSize: '16px' }}>
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
        </div>
    );

    const renderStatus = (status) => (
        <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: status === 'checking' ? '#fff3cd' : '#d4edda',
            color: status === 'checking' ? '#856404' : '#155724'
        }}>
            {status === 'checking' ? 'На проверке' : 'Одобрен'}
        </span>
    );

    if (loading) return <div style={styles.loading}>Загрузка отзывов...</div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Управление отзывами</h1>

            <div style={styles.controls}>
                <div style={styles.filterContainer}>
                    <label style={styles.filterLabel}>Фильтр по статусу:</label>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={styles.select}
                    >
                        <option value="all">Все отзывы</option>
                        <option value="checking">На проверке</option>
                        <option value="accept">Одобренные</option>
                    </select>
                </div>

                <Link to="/admin" style={styles.backLink}>
                    ← Назад в админ-панель
                </Link>
            </div>

            {error && <div style={styles.error}>Ошибка: {error}</div>}

            {!error && reviews.length === 0 ? (
                <div style={styles.empty}>Отзывов не найдено</div>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                        <tr style={styles.headerRow}>
                            {['Блюдо', 'Пользователь', 'Оценка', 'Отзыв', 'Статус', 'Дата', 'Действия'].map((header) => (
                                <th key={header} style={styles.th}>{header}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {reviews.map((review) => (
                            <tr key={review.id} style={styles.row}>
                                <td style={styles.td}>
                                    <Link to={`/dish/${review.dish_id}`} style={styles.dishLink}>
                                        {review.dish_name}
                                    </Link>
                                </td>
                                <td style={styles.td}>{review.user_name}</td>
                                <td style={styles.td}>{renderStars(review.mark)}</td>
                                <td style={{ ...styles.td, ...styles.reviewText }}>{review.text_message}</td>
                                <td style={styles.td}>{renderStatus(review.status)}</td>
                                <td style={styles.td}>
                                    {new Date(review.created_at).toLocaleDateString()}
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actions}>
                                        {review.status === 'checking' && (
                                            <button
                                                onClick={() => handleStatusChange(review.id, 'accept')}
                                                style={styles.approveButton}
                                            >
                                                Одобрить
                                            </button>
                                        )}
                                        {review.status === 'accept' && (
                                            <button
                                                onClick={() => handleStatusChange(review.id, 'checking')}
                                                style={styles.rejectButton}
                                            >
                                                Отклонить
                                            </button>
                                        )}
                                    </div>
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

// Стили компонента
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
    dishLink: {
        color: '#007bff',
        textDecoration: 'none'
    },
    reviewText: {
        maxWidth: '300px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    actions: {
        display: 'flex',
        gap: '8px'
    },
    approveButton: {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#28a745',
        color: 'white',
        cursor: 'pointer'
    },
    rejectButton: {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#dc3545',
        color: 'white',
        cursor: 'pointer'
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

export default AdminReviews;