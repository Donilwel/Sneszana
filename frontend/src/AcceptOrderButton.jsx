import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const AcceptOrderButton = ({ token, orderId, onOrderAccepted }) => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleAcceptOrder = async () => {
        if (!token || !orderId) {
            toast.error('Отсутствуют необходимые данные');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/courier/orders/${orderId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // Обрабатываем структурированные ошибки от бекенда
                const errorMessage = data.message || data.error || 'Не удалось принять заказ';
                throw new Error(errorMessage);
            }

            // Оповещаем родительский компонент об успешном принятии заказа
            if (onOrderAccepted) {
                onOrderAccepted(data.order, data.address);
            }

            toast.success('Заказ успешно принят!');
            navigate('/courier/active-orders');
        } catch (error) {
            console.error('Ошибка при принятии заказа:', error);

            // Более точная обработка различных типов ошибок
            const errorMessage = error.message.toLowerCase();

            if (errorMessage.includes('already taken') ||
                errorMessage.includes('уже взят')) {
                toast.error('Этот заказ уже взят другим курьером');
            } else if (errorMessage.includes('status is not available') ||
                errorMessage.includes('статус')) {
                toast.error('Ваш статус не позволяет принять заказ. Требуется статус "Ожидание"');
            } else if (errorMessage.includes('not found') ||
                errorMessage.includes('не найден')) {
                toast.error('Заказ не найден или был удален');
            } else if (errorMessage.includes('unauthorized') ||
                errorMessage.includes('аутентификации')) {
                toast.error('Требуется авторизация');
                navigate('/login');
            } else {
                toast.error(error.message || 'Произошла непредвиденная ошибка');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleAcceptOrder}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
            }`}
            aria-busy={isLoading}
            aria-label={isLoading ? 'Принимаем заказ' : 'Принять заказ'}
        >
            {isLoading ? (
                <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">↻</span>
                    Принимаем...
                </span>
            ) : (
                'Принять заказ'
            )}
        </button>
    );
};

export default AcceptOrderButton;