import { useState } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import "../../assets/style/landing.css";

export const CardCreadores = () => {
    const { store } = useGlobalReducer();

    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleOpenProfile = (creador) => {
        setSelectedUser(creador);
        setShowModal(true);
    };

    const handleClose = () => {
        setSelectedUser(null);
        setShowModal(false);
    };

    return (
        <>
            {store.imagegentle.map((creator) => (
                <div
                    key={creator.id}
                    className="card p-0 shadow-lg bg-body-territory align-items-center card-creator"
                >
                    {/* Imagen del creador */}
                    <img src={creator.src} className={creator.stl} alt={creator.name} />

                    {/* Información principal */}
                    <div className="card-body text-center">
                        <h5 className="card-title text-primary">{creator.name}</h5>
                        <h6 className="card-title">{creator.subtit}</h6>
                        <p className="card-text">{creator.prrfo}</p>
                    </div>

                    {/* Botón para abrir el modal */}
                    <div className="card-footer w-100 text-center py-3">
                        <button
                            className="btn btn-lg btn-info-default text-white"
                            onClick={() => handleOpenProfile(creator)}
                        >
                            Ver Perfil
                        </button>
                    </div>
                </div>
            ))}

            {/* Modal de perfil */}
            <Modal show={showModal} onHide={handleClose} centered size="lg" scrollable>
                <Modal.Header closeButton className="btn-info-default text-white">
                    <Modal.Title className="fs-5 fs-md-4">{selectedUser?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-3 px-md-4 py-4">
                    {selectedUser && (
                        <div className="row">
                            {/* Columna izquierda: Imagen y Contacto (solo desktop) */}
                            <div className="col-md-4 d-none d-md-block">
                                <div className="text-center mb-4">
                                    <img
                                        src={selectedUser.src}
                                        alt={selectedUser.name}
                                        className="img-fluid rounded mb-3 img-creator-avatar shadow"
                                        style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                                    />
                                    <h5 className="mb-2">{selectedUser.subtit}</h5>
                                </div>

                                {/* Contacto en sidebar para desktop */}
                                <div className="mt-4">
                                    <h6 className="text-primary mb-3 text-center">Contacto</h6>
                                    <div className="d-flex flex-column gap-3">
                                        <a href={selectedUser.contacto?.linkedin} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center gap-2">
                                            <i className="fa-brands fa-linkedin fa-2x text-primary"></i>
                                            <span className="text-muted small">LinkedIn</span>
                                        </a>
                                        <a href={`mailto:${selectedUser.contacto?.email}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center gap-2">
                                            <i className="fa-solid fa-envelope fa-2x text-primary"></i>
                                            <span className="text-muted small">Email</span>
                                        </a>
                                        <a href={selectedUser.contacto?.github} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center gap-2">
                                            <i className="fa-brands fa-github fa-2x text-primary"></i>
                                            <span className="text-muted small">GitHub</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Columna derecha: Información principal */}
                            <div className="col-12 col-md-8">
                                {/* Imagen y título solo en móviles */}
                                <div className="text-center d-md-none mb-4">
                                    <img
                                        src={selectedUser.src}
                                        alt={selectedUser.name}
                                        className="img-fluid rounded mb-3 img-creator-avatar"
                                        style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                                    />
                                    <h5 className="mb-2">{selectedUser.subtit}</h5>
                                </div>

                                {/* Descripción */}
                                <div className="mb-4">
                                    <p className="text-muted px-2 px-md-0 text-center text-md-start">{selectedUser.prrfo}</p>
                                </div>

                                <hr className="my-4" />

                                {/* Habilidades */}
                                <div className="mb-4">
                                    <h6 className="text-primary mb-3 text-center text-md-start">Habilidades</h6>
                                    <div className="d-flex flex-wrap justify-content-center justify-content-md-start gap-2">
                                        {selectedUser.skillstech?.map((skill, index) => (
                                            <Badge key={index} bg="info" className="px-3 py-2">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Experiencia */}
                                <div className="mb-4">
                                    <h6 className="text-primary mb-3 text-center text-md-start">Experiencia</h6>
                                    <ul className="list-group list-group-flush">
                                        {selectedUser.experiencia?.map((exp, index) => (
                                            <li key={index} className="list-group-item border-0 py-2 px-0 text-start">
                                                <i className="fas fa-check-circle text-success me-2"></i>
                                                {exp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Proyectos */}
                                <div className="mb-4">
                                    <h6 className="text-primary mb-3 text-center text-md-start">Proyectos</h6>
                                    <ul className="list-group list-group-flush">
                                        {selectedUser.proyectos?.map((proy, index) => (
                                            <li key={index} className="list-group-item border-0 py-2 px-0 text-start">
                                                <i className="fas fa-folder text-warning me-2"></i>
                                                {proy}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Contacto solo en móviles */}
                                <div className="d-md-none">
                                    <h6 className="text-primary mt-4 mb-3 text-center">Contacto</h6>
                                    <div className="d-flex justify-content-center gap-3 gap-md-4 mb-2">
                                        <a href={selectedUser.contacto?.linkedin} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                            <i className="fa-brands fa-linkedin fa-2x text-primary"></i>
                                        </a>
                                        <a href={`mailto:${selectedUser.contacto?.email}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                            <i className="fa-solid fa-envelope fa-2x text-primary"></i>
                                        </a>
                                        <a href={selectedUser.contacto?.github} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                            <i className="fa-brands fa-github fa-2x text-primary"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

        </>
    );
};
