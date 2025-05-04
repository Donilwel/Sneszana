import { useState } from "react";
import { register } from "./api";

export default function Register() {
    const [form, setForm] = useState({ name: "", email: "", phoneNumber: "", password: "" });
    const [msg, setMsg] = useState("");

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        const res = await register(form);
        const result = await res.json();
        setMsg(res.ok ? "Registered!" : result.message || "Error");
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Register</h2>
            <input name="name" placeholder="Name" onChange={handleChange} />
            <input name="email" placeholder="Email" onChange={handleChange} />
            <input name="phoneNumber" placeholder="Phone" onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} />
            <button type="submit">Register</button>
            <p>{msg}</p>
        </form>
    );
}
