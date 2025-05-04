import { logout } from "./api";

export default function Logout({ token, onLogout }) {
    const handleLogout = async () => {
        const res = await logout(token);
        if (res.ok) {
            onLogout();
            alert("Logged out");
        } else {
            alert("Failed");
        }
    };

    return <button onClick={handleLogout}>Logout</button>;
}
