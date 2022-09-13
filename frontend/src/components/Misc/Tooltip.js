export default function Tooltip({ children, text }) {

    return <>
        <div className="tooltip-container">
            <span className="tooltip">{text}</span>
            {children}
        </div>
    </>;
}