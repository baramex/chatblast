import { Footer } from "../Layout/Footer";

export default function Register() {
    return (
        <>
            <form id="register-form" className="position-absolute top-50 start-50 translate-middle container"
                style={{ width: "40%", maxWidth: 800 }}>
                <div className="text-center">
                    <h1 className="mb-4 fw-normal form-label">Bienvenue sur <strong>ChatBlast</strong></h1>
                    <div className="d-flex direction-column mt-4 justify-content-evenly w-100 inputs-container">
                        <label for="avatar-input"
                            className="rounded-circle me-5 mt-4 pointer position-relative d-flex justify-content-center align-items-center p-1"
                            style={{ width: 150, height: 150 }} id="avatar-container">
                            <p className="fs-5 m-0" style={{ color: "#ececec" }}>Photo de <br />profil</p>
                            <input type="file" accept="image/*" name="avatar" id="avatar-input" />
                            <img className="rounded-circle" id="avatar-img" alt="avatar" hidden />
                            <img className="position-absolute top-0 end-0 me-2 mt-1" width="25%" id="add-picture"
                                src="/images/add-picture.png" alt="add-avatar" />
                        </label>
                        <div className="flex-grow-1 text-start">
                            <input type="text" className="form-control fs-4" id="username" placeholder="Nom d'utilisateur"
                                name="username" autocomplete="off" maxlength="32" required />
                            <input type="password" className="form-control fs-4 mt-4" id="password" placeholder="Mot de passe"
                                name="password" autocomplete="off" maxlength="32" required />
                            <input type="password" className="form-control fs-4 mt-4 mb-2" id="password_"
                                placeholder="Confirmez votre mot de passe" autocomplete="off" maxlength="32" required />
                            <a className="fs-6 align-top" href="/login">Vous avez déjà un compte ?</a>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-4">
                    <input type="submit" className="btn btn-outline-dark btn-lg fs-5 px-5" value="S'inscrire" />
                </div>
            </form>
            <Footer />
        </>
    )
}