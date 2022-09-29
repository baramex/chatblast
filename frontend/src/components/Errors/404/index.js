import { Link } from "react-router-dom";
import Error from "../Error";

export default function Error404() {
    return (<>
        <h1 className="pl-4 pt-3 font-medium text-4xl inline-block hover:underline"><Link to="/" className="text-white">ChatBlast</Link></h1>
        <Error name="404" message="On dirait que vous vous êtes perdu entre les messages." />
    </>);
}