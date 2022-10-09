export default function Tooltip({ children, text }) {
    return <>
        <div className="group relative">
            {children}
            <div role="tooltip" className="inline-block left-1/2 mt-1 -translate-x-1/2 absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-emerald-800 rounded-lg shadow-sm opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100">
                {text}
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
        </div>
    </>;
}