export default function HiddenTab({onClick, ...args}) {
    return (<>
        <div onClick={onClick} className="hidden-tab position-fixed t-0 s-0 bg-dark bg-opacity-50" {...args}></div>
    </>)
}