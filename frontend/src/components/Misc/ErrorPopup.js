import Popup from "./Popup";

export default function ErrorPopup({ message, onClose = undefined }) {
    return <Popup message={message} type="error" onClose={onClose} />;
}