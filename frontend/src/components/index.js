import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Error404 from "./Errors/404";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Terms from "./Terms";

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/terms" element={<Terms />} />

                <Route path="/" element={<Home />} />

                <Route path="*" element={<Error404 />} />
            </Routes>
        </Router>
    );
}

/*function NavigationElement({ element }) {
    const navigation = useNavigate();

    return React.cloneElement(element, { navigation });
}*/