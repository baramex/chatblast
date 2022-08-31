import { Link } from "react-router-dom";
import Error from "../Error";

export default function Error404() {
    return (<>
        <h1 className="ps-3 pt-2"><Link to="/" className="text-decoration-none text-white">ChatBlast</Link></h1>
        <Error name="404" message="On dirait que vous vous êtes perdu entre les messages." />
    </>);
}