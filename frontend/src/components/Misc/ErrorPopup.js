import Popup from "./Popup";

export default function ErrorPopup({ message, onClose = undefined }) {
    return <Popup message={message} onClose={onClose} buttons={[{ name: "Ok", borderColor: "transparent", bgColor: "red-600", textColor: "white", bgHover: "red-700", ringColor: "red-500" }]} />;
}