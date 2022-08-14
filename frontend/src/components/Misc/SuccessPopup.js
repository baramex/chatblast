import Popup from "./Popup";

export default function SuccessPopup({ message, onClose = undefined }) {
    return <Popup message={message} type="valid" onClose={onClose} />;
}