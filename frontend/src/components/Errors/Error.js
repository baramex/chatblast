export default function Error({ name, message }) {
    return (<div className="fixed text-neutral-900 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <h1 className="text-center font-bold text-[8rem]">{name}</h1>
        <p className="text-2xl text-center">{message}</p>
    </div>);
}