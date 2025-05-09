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

                // Автоматический редирект для админа
                if (payload.role === "ADMIN_ROLE" && window.location.pathname === "/") {
                    window.location.href = "/admin";
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

    // Route protection components
    const PrivateRoute = ({ children }) => {
        if (!token) return <Navigate to="/login" replace />;
        return children;
    };

    const AdminRoute = ({ children }) => {
        if (!token) return <Navigate to="/login" replace />;
        if (userRole !== "ADMIN_ROLE") {
            return (
                <div className="access-denied">
                    <h2>Доступ запрещен</h2>
                    <p>Требуются права администратора</p>
                    <Link to="/" className="return-btn">На главную</Link>
                </div>
            );
        }
        return children;
    };

    if (loading) {
        return <div className="loader">Загрузка...</div>;
    }

    return (
        <Router>
            <div className="app-container">
                <header className="app-header">
                    <Link to={userRole === "ADMIN_ROLE" ? "/admin" : "/"} className="app-logo">
                        <span role="img" aria-label="restaurant">🍽</span> Cнежана
                    </Link>

                    {token && (
                        <div className="auth-actions">
                            {userRole === "ADMIN_ROLE" && window.location.pathname !== "/admin" && (
                                <Link to="/admin" className="admin-link">
                                    Админ-панель
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
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        } />
                        <Route path="/admin/users" element={
                            <AdminRoute>
                                <AdminUsers token={token} />
                            </AdminRoute>
                        } />
                        <Route path="/admin/dishes" element={
                            <AdminRoute>
                                <AdminDishes token={token} />
                            </AdminRoute>
                        } />
                        <Route path="/admin/reviews" element={
                            <AdminRoute>
                                <AdminReviews token={token} />
                            </AdminRoute>
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