import { Route, BrowserRouter as Router } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register/register";
import Terms from "./Terms/terms";

export default function App() {
    return (
        <Router>
            <Route path="/" exact component={Home} />

            <Route path="/login" exact component={Login} />
            <Route path="/register" exact component={Register} />

            <Route path="/terms" exact component={Terms} />
        </Router>
    );
}