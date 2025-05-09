import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        if (window.confirm("Are you sure you want to delete this order?")) {
            try {
                const res = await fetch(`/api/orders/${orderId}`, {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || "Failed to delete order");
                }

                // Remove the deleted order from the state
                setOrders(orders.filter((order) => order.ID !== orderId));
                alert("✅ Order deleted successfully");
            } catch (err) {
                alert("❌ Error: " + err.message);
            }
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    return (
        <div style={containerStyle}>
            <h2>My Orders</h2>
            {orders.length === 0 ? (
                <p>No orders found</p>
            ) : (
                <ul style={ordersListStyle}>
                    {orders.map((order) => (
                        <li key={order.ID} style={orderItemStyle}>
                            <div>
                                <strong>Order #{order.ID}</strong>
                            </div>
                            <div>Created: {formatDate(order.CreatedAt)}</div>
                            <div>Status: {order.Status || "Status not available"}</div>
                            <div>Total Price: {formatPrice(order.Price)}</div>

                            <div style={buttonContainerStyle}>
                                <Link to={`/order/${order.ID}`} style={buttonStyle}>
                                    View Order
                                </Link>
                                {order.Status === 'created' && (
                                    <button
                                        onClick={() => handleDeleteOrder(order.ID)}
                                        style={deleteButtonStyle}
                                    >
                                        Delete Order
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

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
};

const buttonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
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
