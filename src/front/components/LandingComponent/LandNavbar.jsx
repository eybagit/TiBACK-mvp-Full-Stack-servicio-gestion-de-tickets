import { Link } from "react-router-dom"
import useGlobalReducer from "../../hooks/useGlobalReducer"

// Utilidades de token seguras
const tokenUtils = {
    decodeToken: (token) => {
        try {
            if (!token) return null;
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            return JSON.parse(atob(parts[1]));
        } catch (error) {
            return null;
        }
    },
    getRole: (token) => {
        const payload = tokenUtils.decodeToken(token);
        return payload ? payload.role : null;
    }
};

// Scroll suave a sección usando window.location.hash (sin useNavigate)
const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: "smooth" });
    } else {
        // Si no está en la página actual, ir a home y luego scroll
        window.location.href = `/#${sectionId}`;
    }
};

export const LandNavbar = () => {
    const { store } = useGlobalReducer();
    const { isAuthenticated, token } = store.auth;
    const role = tokenUtils.getRole(token);

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-default">
            <div className="container">
                <Link className="navbar-brand me-lg-5" to="/">
                    <img src="https://res.cloudinary.com/mystoreimg/image/upload/v1759679927/fsq6shibpipmssroqwe4.png" alt="Logo" className="rounded-3 w-default-logo" />
                </Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent"
                    aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item ms-4"><Link className="nav-link active text-white" to="/">Inicio</Link></li>
                        <li className="nav-item ms-4"><a className="nav-link text-white-50" href="#layout" onClick={(e) => scrollToSection(e, 'layout')}>Diseños</a></li>
                        <li className="nav-item ms-4"><a className="nav-link text-white-50" href="#feature" onClick={(e) => scrollToSection(e, 'feature')}>Características</a></li>
                        {/* <li className="nav-item ms-4"><a className="nav-link text-white-50" href="#price">Precios</a></li> */}
                        <li className="nav-item ms-4"><a className="nav-link text-white-50" href="#question" onClick={(e) => scrollToSection(e, 'question')}>Preguntas Frecuentes</a></li>
                        <li className="nav-item ms-4"><Link className="nav-link text-white-50" to="/contact">Contacto</Link></li>
                    </ul>
                    <div className="d-flex">
                        {isAuthenticated && role ? (
                            <ul className="navbar-nav me-4 mb-2 mb-lg-0">
                                <li className="nav-item">
                                    <Link to={`/${role}`} className="nav-link text-white">
                                        <i className="fas fa-tachometer-alt me-2"></i>
                                        Dashboard
                                    </Link>
                                </li>
                            </ul>
                        ) : (
                            <ul className="navbar-nav me-4 mb-2 mb-lg-0">
                                <li className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        Iniciar Sesion
                                    </a>
                                    <ul className="dropdown-menu">
                                        <li><Link className="dropdown-item" to="/auth?role=administrador">Administrador</Link></li>
                                        <li><Link className="dropdown-item" to="/auth?role=supervisor">Supervisor</Link></li>
                                        <li><Link className="dropdown-item" to="/auth?role=analista">Analista</Link></li>
                                        <li><Link className="dropdown-item" to="/auth?role=cliente">Cliente</Link></li>
                                    </ul>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}