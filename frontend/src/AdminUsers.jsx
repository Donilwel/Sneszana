import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminUsers({ token }) {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState("all");
    const [editingUserId, setEditingUserId] = useState(null);
    const [newRole, setNewRole] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const roles = ["ADMIN_ROLE", "COURIER_ROLE", "CUSTOMER_ROLE", "STAFF_ROLE"];
    const rolesForFilter = ["all", ...roles];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Ошибка загрузки пользователей");
                setUsers(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const filtered = users.filter(user => {
        const matchesRole = selectedRole === "all" || user.Role === selectedRole;
        const matchesSearch = user.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.Email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const handleUpdateRole = async (userId, username) => {
        if (!newRole) {
            alert("Выберите новую роль");
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${username}?role=${newRole}`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Ошибка обновления роли");
            }

            // Обновляем локальное состояние
            setUsers(users.map(user =>
                user.ID === userId ? {...user, Role: newRole} : user
            ));

            setEditingUserId(null);
            setNewRole("");
            alert("Роль успешно обновлена");
        } catch (err) {
            alert(`Ошибка: ${err.message}`);
        }
    };

    const startEditing = (userId, currentRole) => {
        setEditingUserId(userId);
        setNewRole(currentRole);
    };

    const cancelEditing = () => {
        setEditingUserId(null);
        setNewRole("");
    };

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (loading) return <p>Загрузка пользователей...</p>;

    return (
        <div style={{ padding: "2rem" }}>
            <h2 style={titleStyle}>👥 Управление пользователями</h2>

            <div style={searchContainer}>
                <input
                    type="text"
                    placeholder="Поиск по имени или email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={searchInput}
                />
            </div>

            <div style={categoryStyle}>
                {rolesForFilter.map(role => (
                    <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        style={{
                            ...roleBtn,
                            ...(selectedRole === role ? roleBtnActive : {}),
                        }}
                    >
                        {role === "all" ? "Все" : role.replace("_ROLE", "")}
                    </button>
                ))}
            </div>

            <div style={gridStyle}>
                {filtered.length > 0 ? (
                    filtered.map(user => (
                        <div key={user.ID} style={cardStyle}>
                            <div style={avatarContainer}>
                                <div style={{
                                    ...avatarStyle,
                                    backgroundColor: getRoleColor(user.Role)
                                }}>
                                    {user.Name.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            <div style={infoStyle}>
                                <h3>{user.Name}</h3>
                                <p style={detailText}><strong>Email:</strong> {user.Email}</p>
                                <p style={detailText}><strong>Телефон:</strong> {user.PhoneNumber}</p>

                                {editingUserId === user.ID ? (
                                    <div style={roleEditContainer}>
                                        <select
                                            value={newRole}
                                            onChange={(e) => setNewRole(e.target.value)}
                                            style={roleSelect}
                                        >
                                            {roles.map(role => (
                                                <option key={role} value={role}>
                                                    {role.replace("_ROLE", "")}
                                                </option>
                                            ))}
                                        </select>
                                        <div style={editButtons}>
                                            <button
                                                onClick={() => handleUpdateRole(user.ID, user.Name)}
                                                style={saveButton}
                                            >
                                                Сохранить
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                style={cancelButton}
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p style={{
                                            ...roleBadge,
                                            backgroundColor: getRoleColor(user.Role)
                                        }}>
                                            {user.Role.replace("_ROLE", "")}
                                        </p>
                                        <div style={actionsStyle}>
                                            <button
                                                onClick={() => startEditing(user.ID, user.Role)}
                                                style={actionBtn}
                                            >
                                                Изменить роль
                                            </button>
                                            <button
                                                style={{
                                                    ...actionBtn,
                                                    backgroundColor: "#dc3545",
                                                    ':hover': {
                                                        backgroundColor: "#c82333",
                                                    }
                                                }}
                                                onClick={() => handleDelete(user.ID)}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={noResultsStyle}>Пользователи не найдены</p>
                )}
            </div>
        </div>
    );
}

function getRoleColor(role) {
    switch(role) {
        case "ADMIN_ROLE": return "#28a745";
        case "COURIER_ROLE": return "#17a2b8";
        case "CUSTOMER_ROLE": return "#6c757d";
        default: return "#6c757d";
    }
}

async function handleDelete(userId) {
    if (!window.confirm("Вы уверены, что хотите удалить этого пользователя?")) return;

    try {
        const res = await fetch(`/api/admin/users/${userId}`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!res.ok) throw new Error("Ошибка при удалении");
        alert("Пользователь успешно удален");
        window.location.reload();
    } catch (err) {
        alert(err.message);
    }
}

// Стилизация компонентов

const roleEditContainer = {
    margin: "1rem 0",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
};

const roleSelect = {
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "0.9rem"
};

const editButtons = {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "center"
};

const saveButton = {
    padding: "0.5rem 1rem",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
};

const cancelButton = {
    padding: "0.5rem 1rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
};

const titleStyle = {
    textAlign: "center",
    fontSize: "2rem",
    marginBottom: "2rem",
    color: "#343a40"
};

const categoryStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    marginBottom: "2rem",
    flexWrap: "wrap"
};

const roleBtn = {
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    border: "1px solid #ddd",
    background: "#f8f9fa",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ':hover': {
        background: "#e9ecef",
    },
};

const roleBtnActive = {
    background: "#343a40",
    color: "#fff",
    borderColor: "#343a40",
};

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
};

const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    transition: "transform 0.2s ease",
    ':hover': {
        transform: "translateY(-3px)",
    },
};

const avatarContainer = {
    display: "flex",
    justifyContent: "center",
    padding: "1.5rem 0",
    backgroundColor: "#f8f9fa"
};

const avatarStyle = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "2rem",
    fontWeight: "bold"
};

const infoStyle = {
    padding: "1.5rem",
    textAlign: "center"
};

const detailText = {
    margin: "0.5rem 0",
    color: "#6c757d",
    fontSize: "0.9rem"
};

const roleBadge = {
    display: "inline-block",
    padding: "0.25rem 0.5rem",
    borderRadius: "20px",
    color: "#fff",
    fontSize: "0.8rem",
    margin: "0.5rem 0"
};

const actionsStyle = {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1rem",
    justifyContent: "center"
};

const actionBtn = {
    padding: "0.5rem 1rem",
    borderRadius: "5px",
    backgroundColor: "#007bff",
    color: "#fff",
    textDecoration: "none",
    fontSize: "0.9rem",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.3s",
    ':hover': {
        backgroundColor: "#0056b3",
    },
};

const searchContainer = {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.5rem"
};

const searchInput = {
    padding: "0.5rem 1rem",
    width: "100%",
    maxWidth: "500px",
    borderRadius: "20px",
    border: "1px solid #ddd",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.2s ease",
    ':focus': {
        borderColor: "#007bff",
        boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)"
    }
};

const noResultsStyle = {
    textAlign: "center",
    gridColumn: "1 / -1",
    color: "#6c757d",
    fontSize: "1.2rem",
    marginTop: "2rem"
};