import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Logout from "./Logout";
import Dishes from "./Dishes";
import DishDetails from "./DishDetails";

function App() {
    const [token, setToken] = useState("");

    return (
        <Router>
            <div style={{ padding: "1rem" }}>
                <h1>🍽 Vite Auth</h1>
                {token && <Logout token={token} onLogout={() => setToken("")} />}
                <Routes>
                    <Route path="/" element={
                        token ? <Dishes token={token} /> : <Login onLogin={setToken} />
                    } />
                    <Route path="/register" element={
                        token ? <Navigate to="/" /> : <Register />
                    } />
                    <Route path="/dish/:id" element={
                        token ? <DishDetails /> : <Navigate to="/" />
                    } />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
