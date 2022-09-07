import Popup from "./Popup";

export default function SuccessPopup({ message, onClose = undefined, canClose = true }) {
    return <Popup message={message} type="valid" onClose={onClose} canClose={canClose} />;
}