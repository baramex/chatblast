import Popup from "./Popup";

export default function SuccessPopup({ message, onClose = undefined }) {
    return <Popup message={message} onClose={onClose} buttons={[{ name: "Ok", borderColor: "transparent", bgColor: "green-600", textColor: "white", bgHover: "green-700", ringColor: "green-500" }]} />;
}