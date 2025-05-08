import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Logout from "./Logout";
import Dishes from "./Dishes";
import DishDetails from "./DishDetails";
import Orders from "./Order"; // импортируем новый компонент
import OrderDetailsPage from "./OrderDetailsPage"; // импортируем компонент для деталей заказа

function App() {
    const [token, setToken] = useState(localStorage.getItem("token") || ""); // получаем токен из localStorage
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token); // сохраняем токен в localStorage
        } else {
            localStorage.removeItem("token"); // удаляем токен при выходе
        }
        setLoading(false); // флаг завершения загрузки
    }, [token]);

    // Переход в раздел авторизации, если токен отсутствует
    const PrivateRoute = ({ children }) => {
        return token ? children : <Navigate to="/" />;
    };

    return (
        <Router>
            <div style={{ padding: "1rem" }}>
                <h1>🍽 Vite Auth</h1>
                {token && <Logout token={token} onLogout={() => setToken("")} />} {/* кнопка для выхода */}
                {loading ? (
                    <p>Loading...</p> // выводим сообщение во время загрузки
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
                            path="/orders"
                            element={
                                <PrivateRoute>
                                    <Orders token={token} /> {/* защищённый маршрут для заказов */}
                                </PrivateRoute>
                            }
                        />
                        {/* Новый маршрут для деталей заказа */}
                        <Route
                            path="/order/:orderId"
                            element={
                                <PrivateRoute>
                                    <OrderDetailsPage token={token} />
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
