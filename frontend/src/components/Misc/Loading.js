export default function Loading({ height = "h-9", width = "w-9", color = "text-emerald-600" }) {
    return (
        <svg className={`animate-spin -ml-1 mr-3 ${height} ${width} ${color}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"></circle>
            <path className="opacity-75" fill="currentColor" d="M 4 12 a 8 8 0 0 1 8 -8 V 1 C 5.373 1 1 5.373 1 12 h 4 z m 2 5.291 A 7.962 7.962 0 0 1 4 12 H 1 c 0 3.042 1.135 5.824 3 7.938 l 2 -2.647 z"></path>
        </svg >
    );
}