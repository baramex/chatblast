export default function Article({ index, content }) {
    return (
        <li>
            <h2 className="mb-3 mt-5 text-3xl font-medium">Article {index}</h2>
            <p className="text-lg">{content}</p>
        </li>
    );
}