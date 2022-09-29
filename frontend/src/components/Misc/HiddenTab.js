export default function HiddenTab({ onClick, zIndex="", ...args }) {
    return (<>
        <div onClick={onClick} className={"bg-neutral-800/50 fixed top-0 left-0 w-[100vw] h-[100vh] backdrop-blur-sm " + zIndex} {...args}></div>
    </>)
}