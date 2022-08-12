export default function Article({ index, content }) {
    return (
        <li>
            <h1 className="mb-3 mt-5">Article {index}</h1>
            <p className="fs-5">{content}</p>
        </li>
    );
}