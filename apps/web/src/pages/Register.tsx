import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../auth/firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const onRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        await createUserWithEmailAndPassword(auth, email, password);
        navigate("/trip-circle/dashboard");
    };

    return (
        <div>
            <h1>Register</h1>
            <form onSubmit={onRegister}>
                <input placeholder="email" onChange={(e) => setEmail(e.target.value)} />
                <input
                    placeholder="password"
                    type="password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit">Register</button>
            </form>

            <p>
                Already have an account? <Link to="/trip-circle/login">Login</Link>
            </p>
        </div>
    );
}
