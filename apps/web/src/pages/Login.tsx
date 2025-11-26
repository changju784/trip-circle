import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../auth/firebase";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const onLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/trip-circle/dashboard");
    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={onLogin}>
                <input placeholder="email" onChange={(e) => setEmail(e.target.value)} />
                <input
                    placeholder="password"
                    type="password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit">Login</button>
            </form>
            <p>
                No account? <Link to="/trip-circle/register">Register</Link>
            </p>
        </div>
    );
}
