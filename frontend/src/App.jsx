import { useState } from "react";
import Register from "./Register";
import Login from "./Login";
import Logout from "./Logout";
import Dishes from "./Dishes.jsx";

function App() {
    const [token, setToken] = useState("");

    return (
        <div style={{ padding: "1rem" }}>
            <h1>Vite Auth</h1>
            {token ? (
                <>
                    <p>Welcome, authenticated user</p>
                    <Logout token={token} onLogout={() => setToken("")} />
                    <hr />
                    <Dishes token={token} />
                </>
            ) : (
                <>
                    <Register />
                    <hr />
                    <Login onLogin={setToken} />
                </>
            )}
        </div>
    );
}

export default App;
