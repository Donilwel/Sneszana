import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import './App.css';  // Импортируем стили

import Register from "./Register";
import Login from "./Login";
import Logout from "./Logout";
import Dishes from "./Dishes";
import DishDetails from "./DishDetails";
import Orders from "./Order";
import OrderDetailsPage from "./OrderDetailsPage";
import CreateOrderPage from "./CreateOrderPage";
import DishReviews from "./DishReviews"; // Импортируем новый компонент
import WriteReview from "./WriteReview"; // Импортируем компонент для написания отзыва

function App() {
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
        setLoading(false);
    }, [token]);

    const PrivateRoute = ({ children }) => {
        return token ? children : <Navigate to="/" />;
    };

    return (
        <Router>
            <div style={{ padding: "1rem" }}>
                <h1>
                    <Link to="/" className="header">🍽 Cнежана</Link>
                </h1>
                {token && <Logout token={token} onLogout={() => setToken("")} />}
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <Routes>
                        <Route
                            path="/"
                            element={
                                token ? <Dishes token={token} /> : <Login onLogin={setToken} />
                            }
                        />
                        <Route
                            path="/register"
                            element={token ? <Navigate to="/" /> : <Register />}
                        />
                        <Route
                            path="/dish/:id"
                            element={
                                <PrivateRoute>
                                    <DishDetails token={token} />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/dish/:id/reviews"
                            element={
                                <PrivateRoute>
                                    <DishReviews token={token} />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/dish/:id/write-review"
                            element={
                                <PrivateRoute>
                                    <WriteReview token={token} />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/orders"
                            element={
                                <PrivateRoute>
                                    <Orders token={token} />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/order/:orderId"
                            element={
                                <PrivateRoute>
                                    <OrderDetailsPage token={token} />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/create-order"
                            element={
                                <PrivateRoute>
                                    <CreateOrderPage token={token} />
                                </PrivateRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                )}
            </div>
        </Router>
    );
}

export default App;
