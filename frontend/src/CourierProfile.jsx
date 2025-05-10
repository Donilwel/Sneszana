import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CourierProfile = ({ token }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        vehicle: '',
        status: ''
    });
    const navigate = useNavigate();

    // Генерация аватара по имени
    const generateAvatar = (name) => {
        const colors = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
            '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D'];
        const firstLetter = name?.charAt(0).toUpperCase() || 'C';
        const colorIndex = firstLetter.charCodeAt(0) % colors.length;
        return {
            letter: firstLetter,
            color: colors[colorIndex]
        };
    };

    const avatar = profile ? generateAvatar(profile.User.Name) : generateAvatar('Courier');

    // Загрузка профиля курьера
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/courier', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error('Не удалось загрузить профиль курьера');
                }

                const data = await res.json();
                setProfile(data);
                setFormData({
                    vehicle: data.Vehicle,
                    status: data.Status
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token]);

    // Обработчик изменения формы
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Обновление профиля курьера
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/courier', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    vehicle: formData.vehicle,
                    status: formData.status
                })
            });

            if (!res.ok) {
                throw new Error('Не удалось обновить профиль');
            }

            const updatedData = await res.json();
            setProfile(updatedData);
            setEditMode(false);
            alert('Профиль успешно обновлен');
        } catch (err) {
            setError(err.message);
        }
    };

    // Получение читаемого статуса
    const getStatusName = (status) => {
        switch(status) {
            case 'ACTIVE': return 'Активен';
            case 'UNACTIVE': return 'Неактивен';
            case 'ON_DELIVERY': return 'На доставке';
            default: return status;
        }
    };

    if (loading) return <div style={styles.loading}>Загрузка профиля...</div>;
    if (error) return <div style={styles.error}>Ошибка: {error}</div>;
    if (!profile) return <div style={styles.error}>Профиль не найден</div>;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>Профиль курьера</h1>
                <div style={styles.headerButtons}>
                    <button
                        onClick={() => navigate('/courier/orders')}
                        style={styles.ordersButton}
                    >
                        Доступные заказы
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        style={styles.backButton}
                    >
                        На главную
                    </button>
                </div>
            </header>

            <div style={styles.profileContainer}>
                <div style={styles.avatarSection}>
                    <div style={{
                        ...styles.avatar,
                        backgroundColor: avatar.color
                    }}>
                        {avatar.letter}
                    </div>
                    <h2 style={styles.userName}>{profile.User.Name}</h2>
                </div>

                <div style={styles.userInfo}>
                    <p><strong>Email:</strong> {profile.User.Email}</p>
                    <p><strong>Телефон:</strong> {profile.User.PhoneNumber}</p>
                    <p><strong>Рейтинг:</strong> {profile.Rating || 'Нет оценок'}</p>
                    <p><strong>Выполнено заказов:</strong> {profile.OrdersCount}</p>
                </div>

                {editMode ? (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Транспорт:</label>
                            <select
                                name="vehicle"
                                value={formData.vehicle}
                                onChange={handleChange}
                                style={styles.select}
                                required
                            >
                                <option value="NONE">Не указано</option>
                                <option value="CAR">Автомобиль</option>
                                <option value="BIKE">Велосипед</option>
                                <option value="SCOOTER">Скутер</option>
                                <option value="FOOT">Пешком</option>
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Статус:</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                style={styles.select}
                                required
                            >
                                <option value="UNACTIVE">Неактивен</option>
                                <option value="ACTIVE">Активен</option>
                                <option value="ON_DELIVERY">На доставке</option>
                            </select>
                        </div>

                        <div style={styles.buttonGroup}>
                            <button
                                type="submit"
                                style={styles.saveButton}
                            >
                                Сохранить
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditMode(false)}
                                style={styles.cancelButton}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                ) : (
                    <div style={styles.courierInfo}>
                        <h3>Информация о курьере</h3>
                        <p><strong>Транспорт:</strong> {profile.Vehicle}</p>
                        <p>
                            <strong>Статус:</strong>
                            <span style={{
                                ...styles.statusBadge,
                                ...getStatusStyle(profile.Status)
                            }}>
                                {getStatusName(profile.Status)}
                            </span>
                        </p>

                        <button
                            onClick={() => setEditMode(true)}
                            style={styles.editButton}
                        >
                            Редактировать профиль
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Стили
const styles = {
    container: {
        maxWidth: '800px',
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
    headerButtons: {
        display: 'flex',
        gap: '10px'
    },
    ordersButton: {
        padding: '8px 16px',
        backgroundColor: '#17a2b8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    backButton: {
        padding: '8px 16px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    profileContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr'
        }
    },
    avatarSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '20px'
    },
    avatar: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        color: 'white',
        fontWeight: 'bold',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    userInfo: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
    },
    userName: {
        color: '#333',
        margin: 0,
        fontSize: '24px'
    },
    courierInfo: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        gridColumn: '1 / -1'
    },
    statusBadge: {
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '12px',
        marginLeft: '10px',
        fontSize: '14px',
        fontWeight: '500'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        gridColumn: '1 / -1'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontWeight: '500',
        color: '#555'
    },
    select: {
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '16px'
    },
    buttonGroup: {
        display: 'flex',
        gap: '10px',
        marginTop: '20px'
    },
    saveButton: {
        padding: '10px 20px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    cancelButton: {
        padding: '10px 20px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    editButton: {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '20px',
        fontSize: '16px'
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
        case 'ACTIVE': return { backgroundColor: '#d4edda', color: '#155724' };
        case 'UNACTIVE': return { backgroundColor: '#f8d7da', color: '#721c24' };
        case 'ON_DELIVERY': return { backgroundColor: '#fff3cd', color: '#856404' };
        default: return { backgroundColor: '#e2e3e5', color: '#383d41' };
    }
};

export default CourierProfile;