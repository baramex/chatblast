export default function Loading({ size = "md", color = "text-theme", type = "border" }) {
    return (
        <div className={`spinner-${type} ${color} spinner-${type}-${size}`} style={size === "lg" ? { width: "3rem", height: "3rem" } : {}} role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
    );
}