import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const DishReviews = ({ token }) => {
    const { id: dishId } = useParams();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/orders/reviews/dish/${dishId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    throw new Error('Ошибка при загрузке отзывов');
                }

                const data = await res.json();
                setReviews(data.map(review => ({
                    ...review,
                    isExpanded: false,
                    // Генерируем случайный аватар, если нет реального
                    avatar: `https://png.pngtree.com/png-vector/20220608/ourlarge/pngtree-user-profile-character-faceless-unknown-png-image_4816132.png`
                })));
                setError(data.length === 0 ? 'Отзывов для этого блюда не найдено' : '');
            } catch (err) {
                console.error('Ошибка загрузки:', err);
                setError(err.message || 'Произошла ошибка при загрузке отзывов');
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [dishId, token]);

    const renderStars = (rating) => (
        <div style={{ color: '#ffc107', fontSize: '16px' }}>
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
        </div>
    );

    const toggleReview = (index) => {
        setReviews(prevReviews => {
            const newReviews = [...prevReviews];
            newReviews[index].isExpanded = !newReviews[index].isExpanded;
            return newReviews;
        });
    };

    if (loading) return <div style={styles.loading}>Загрузка отзывов...</div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Отзывы о блюде</h1>

            {error && <div style={styles.error}>Ошибка: {error}</div>}

            {!error && reviews.length === 0 ? (
                <div style={styles.empty}>Отзывов не найдено</div>
            ) : (
                <div style={styles.reviewsContainer}>
                    {reviews.map((review, index) => (
                        <div key={review.ID} style={styles.reviewCard}>
                            <div style={styles.reviewHeader}>
                                <div style={styles.userInfo}>
                                    <img
                                        src={review.avatar}
                                        alt="Аватар"
                                        style={styles.avatar}
                                    />
                                    <div>
                                        <span style={styles.userName}>Пользователь #{review.UserID}</span>
                                        <div style={styles.rating}>{renderStars(review.mark)}</div>
                                    </div>
                                </div>
                                {review.text_message.length > 100 && (
                                    <button
                                        style={styles.toggleButton}
                                        onClick={() => toggleReview(index)}
                                    >
                                        {review.isExpanded ? 'Скрыть' : 'Показать полностью'}
                                    </button>
                                )}
                            </div>
                            <div style={styles.reviewContent}>
                                {review.isExpanded
                                    ? review.text_message
                                    : `${review.text_message.substring(0, 100)}${review.text_message.length > 100 ? '...' : ''}`
                                }
                            </div>
                        </div>
                    ))}
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
    reviewsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        border: '1px solid #eee'
    },
    reviewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '15px',
        flexWrap: 'wrap',
        gap: '15px'
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    avatar: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #f0f0f0'
    },
    userName: {
        fontWeight: '600',
        color: '#333',
        display: 'block',
        marginBottom: '5px'
    },
    rating: {
        display: 'flex',
        alignItems: 'center'
    },
    reviewContent: {
        color: '#555',
        lineHeight: '1.5',
        wordBreak: 'break-word',
        paddingLeft: '65px' // Чтобы текст был под именем, а не под аватаркой
    },
    toggleButton: {
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        padding: '8px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ':hover': {
            backgroundColor: '#0069d9'
        }
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
        margin: '20px 0'
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

export default DishReviews;