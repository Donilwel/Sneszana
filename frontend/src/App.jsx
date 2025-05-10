import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import './App.css';

// Components
import Register from "./Register";
import Login from "./Login";
import Logout from "./Logout";
import Dishes from "./Dishes";
import AdminDishes from "./AdminDishes";
import DishDetails from "./DishDetails";
import Orders from "./Order";
import OrderDetailsPage from "./OrderDetailsPage";
import CreateOrderPage from "./CreateOrderPage";
import DishReviews from "./DishReviews";
import WriteReview from "./WriteReview";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminReviews from "./AdminReviews";
import AdminCouriers from "./AdminCouriers";
import CookerDashboard from "./CookerDashboard";
import CourierProfile from "./CourierProfile";
import CourierOrders from "./CourierOrders";

function App() {
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState("");

    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role || "CUSTOMER_ROLE");

                // Автоматический редирект в зависимости от роли
                if (window.location.pathname === "/") {
                    if (payload.role === "ADMIN_ROLE") {
                        navigate("/admin");
                    } else if (payload.role === "COOKER_ROLE") {
                        navigate("/cooker");
                    } else if (payload.role === "COURIER_ROLE") {
                        navigate("/courier");
                    }
                }
            } catch (err) {
                console.error("Token decoding error:", err);
            }
        } else {
            localStorage.removeItem("token");
            setUserRole("");
        }
        setLoading(false);
    }, [token]);

    // Компоненты для защиты маршрутов
    const PrivateRoute = ({ children, requiredRole }) => {
        if (!token) return <Navigate to="/login" replace />;

        // Проверка роли, если требуется
        if (requiredRole && userRole !== requiredRole) {
            return (
                <div className="access-denied">
                    <h2>Доступ запрещен</h2>
                    <p>Требуются права {getRoleDisplayName(requiredRole)}</p>
                    <Link to="/" className="return-btn">На главную</Link>
                </div>
            );
        }

        return children;
    };

    // Функция для отображения названия роли
    const getRoleDisplayName = (role) => {
        switch(role) {
            case "ADMIN_ROLE": return "администратора";
            case "COOKER_ROLE": return "повара";
            case "COURIER_ROLE": return "курьера";
            default: return "пользователя";
        }
    };

    if (loading) {
        return <div className="loader">Загрузка...</div>;
    }

    return (
        <Router>
            <div className="app-container">
                <header className="app-header">
                    <Link to={
                        userRole === "ADMIN_ROLE" ? "/admin" :
                            userRole === "COOKER_ROLE" ? "/cooker" :
                                userRole === "COURIER_ROLE" ? "/courier" : "/"
                    } className="app-logo">
                        <span role="img" aria-label="restaurant">🍽</span> Cнежана
                    </Link>

                    {token && (
                        <div className="auth-actions">
                            {userRole === "ADMIN_ROLE" && window.location.pathname !== "/admin" && (
                                <Link to="/admin" className="admin-link">
                                    Админ-панель
                                </Link>
                            )}
                            {userRole === "COOKER_ROLE" && window.location.pathname !== "/cooker" && (
                                <Link to="/cooker" className="admin-link">
                                    Панель повара
                                </Link>
                            )}
                            {userRole === "COURIER_ROLE" && window.location.pathname !== "/courier" && (
                                <Link to="/courier" className="admin-link">
                                    Профиль курьера
                                </Link>
                            )}
                            <Logout token={token} onLogout={() => setToken("")} />
                        </div>
                    )}
                </header>

                <main className="app-content">
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={
                            token ? (
                                userRole === "ADMIN_ROLE" ? (
                                    <Navigate to="/admin" replace />
                                ) : userRole === "COOKER_ROLE" ? (
                                    <Navigate to="/cooker" replace />
                                ) : userRole === "COURIER_ROLE" ? (
                                    <Navigate to="/courier" replace />
                                ) : (
                                    <Dishes token={token} />
                                )
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        } />
                        <Route path="/login" element={
                            token ? <Navigate to="/" replace /> : <Login onLogin={setToken} />
                        } />
                        <Route path="/register" element={
                            token ? <Navigate to="/" replace /> : <Register />
                        } />

                        {/* Private routes */}
                        <Route path="/dish/:id" element={
                            <PrivateRoute>
                                <DishDetails token={token} />
                            </PrivateRoute>
                        } />
                        <Route path="/dish/:id/reviews" element={
                            <PrivateRoute>
                                <DishReviews token={token} />
                            </PrivateRoute>
                        } />
                        <Route path="/dish/:id/write-review" element={
                            <PrivateRoute>
                                <WriteReview token={token} />
                            </PrivateRoute>
                        } />
                        <Route path="/orders" element={
                            <PrivateRoute>
                                <Orders token={token} />
                            </PrivateRoute>
                        } />
                        <Route path="/order/:orderId" element={
                            <PrivateRoute>
                                <OrderDetailsPage token={token} />
                            </PrivateRoute>
                        } />
                        <Route path="/create-order" element={
                            <PrivateRoute>
                                <CreateOrderPage token={token} />
                            </PrivateRoute>
                        } />

                        {/* Admin routes */}
                        <Route path="/admin" element={
                            <PrivateRoute requiredRole="ADMIN_ROLE">
                                <AdminDashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/admin/users" element={
                            <PrivateRoute requiredRole="ADMIN_ROLE">
                                <AdminUsers token={token} />
                            </PrivateRoute>
                        } />
                        <Route path="/admin/dishes" element={
                            <PrivateRoute requiredRole="ADMIN_ROLE">
                                <AdminDishes token={token} />
                            </PrivateRoute>
                        } />
                        <Route path="/admin/reviews" element={
                            <PrivateRoute requiredRole="ADMIN_ROLE">
                                <AdminReviews token={token} />
                            </PrivateRoute>
                        } />
                        <Route path="/admin/couriers" element={
                            <PrivateRoute requiredRole="ADMIN_ROLE">
                                <AdminCouriers token={token} />
                            </PrivateRoute>
                        } />
                        <Route path="/courier/orders" element={
                            <PrivateRoute requiredRole="COURIER_ROLE">
                                <CourierOrders token={token} />
                            </PrivateRoute>
                        } />

                        {/* Cooker routes */}
                        <Route path="/cooker" element={
                            <PrivateRoute requiredRole="COOKER_ROLE">
                                <CookerDashboard token={token} />
                            </PrivateRoute>
                        } />

                        {/* Courier routes */}
                        <Route path="/courier" element={
                            <PrivateRoute requiredRole="COURIER_ROLE">
                                <CourierProfile token={token} />
                            </PrivateRoute>
                        } />

                        {/* Fallback route */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;