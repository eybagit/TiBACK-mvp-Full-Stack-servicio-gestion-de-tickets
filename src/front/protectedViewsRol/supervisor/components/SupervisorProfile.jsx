import React from 'react';

const SupervisorProfile = ({
    infoData,
    handleInfoChange,
    setActiveView,
    updateInfo,
    updatingInfo
}) => {
    return (
        <>
            <h1 className="hyper-page-title">Mi Perfil</h1>

            <div className="hyper-widget">
                <div className="hyper-widget-header">
                    <h3 className="hyper-widget-title">Información Personal</h3>
                </div>

                <div className="row g-3">
                    <div className="col-md-6">
                        <label htmlFor="nombre" className="form-label">Nombre *</label>
                        <input
                            type="text"
                            className="form-control"
                            id="nombre"
                            name="nombre"
                            value={infoData.nombre}
                            onChange={handleInfoChange}
                            placeholder="Ingresa tu nombre"
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="apellido" className="form-label">Apellido *</label>
                        <input
                            type="text"
                            className="form-control"
                            id="apellido"
                            name="apellido"
                            value={infoData.apellido}
                            onChange={handleInfoChange}
                            placeholder="Ingresa tu apellido"
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="email" className="form-label">Email *</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={infoData.email}
                            onChange={handleInfoChange}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="telefono" className="form-label">Teléfono</label>
                        <input
                            type="tel"
                            className="form-control"
                            id="telefono"
                            name="telefono"
                            value={infoData.telefono}
                            onChange={handleInfoChange}
                            placeholder="Ingresa tu teléfono"
                        />
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setActiveView('dashboard')}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={updateInfo}
                        disabled={updatingInfo}
                    >
                        {updatingInfo ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Actualizando...
                            </>
                        ) : (
                            'Actualizar Información'
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default SupervisorProfile;
