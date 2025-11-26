import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../auth/firebase";

export default function Dashboard() {
    return (
        <div>
            <h1>Welcome!</h1>
            <button onClick={() => signOut(auth)}>Logout</button>
        </div>
    );
}
