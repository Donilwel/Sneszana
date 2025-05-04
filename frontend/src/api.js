const BASE_URL = "/api/auth";

export async function register(data) {
    return fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function login(data) {
    return fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function logout(token) {
    return fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}
