import React from "react";
import { Route, BrowserRouter as Router, Routes, useNavigate } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Terms from "./Terms";

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<NavigationElement element={<Login />} />} />
                <Route path="/register" element={<NavigationElement element={<Register />} />} />

                <Route path="/terms" element={<Terms />} />

                <Route path="/" element={<NavigationElement element={<Home />} />} />
            </Routes>
        </Router>
    );
}

function NavigationElement({ element }) {
    const navigation = useNavigate();

    return React.cloneElement(element, { navigation });
}