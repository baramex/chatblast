export default function Error({ name, message }) {
    return (<div className="position-fixed top-50 start-50 translate-middle">
        <h1 className="text-center fw-bold" style={{fontSize: "8rem"}}>{name}</h1>
        <p className="fs-5">{message}</p>
    </div>);
}