import { useState } from "react";
import { login } from "./api";

export default function Login({ onLogin }) {
    const [form, setForm] = useState({ email: "", password: "" });
    const [msg, setMsg] = useState("");

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        const res = await login(form);
        const data = await res.json();
        if (res.ok && data.token) {
            onLogin(data.token);
            setMsg("Logged in!");
        } else {
            setMsg("Invalid credentials");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Login</h2>
            <input name="email" placeholder="Email" onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} />
            <button type="submit">Login</button>
            <p>{msg}</p>
        </form>
    );
}
