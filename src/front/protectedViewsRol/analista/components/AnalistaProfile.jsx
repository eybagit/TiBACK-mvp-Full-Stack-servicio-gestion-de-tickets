import React from 'react';

/**
 * AnalistaProfile - Componente de presentación para el perfil del analista
 */
function AnalistaProfile({
    infoData,
    handleInfoChange,
    error,
    setActiveView,
    setError,
    setInfoData,
    updateInfo,
    updatingInfo
}) {
    return (
        <div className="px-3">
            <h1 className="hyper-page-title">Mi Perfil</h1>

            <div className="hyper-widget">
                <div className="hyper-widget-header">
                    <h3 className="hyper-widget-title">Información Personal</h3>
                </div>

                <div className="px-3">
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
                            <label htmlFor="especialidad" className="form-label">Especialidad *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="especialidad"
                                name="especialidad"
                                value={infoData.especialidad}
                                onChange={handleInfoChange}
                                placeholder="Ingresa tu especialidad"
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="password" className="form-label">Nueva Contraseña (opcional)</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                name="password"
                                value={infoData.password}
                                onChange={handleInfoChange}
                                placeholder="Dejar vacío para no cambiar"
                            />
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña</label>
                            <input
                                type="password"
                                className="form-control"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={infoData.confirmPassword}
                                onChange={handleInfoChange}
                                placeholder="Confirmar nueva contraseña"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger mt-3" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="mt-3 d-flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                setActiveView('tickets');
                                setError('');
                                setInfoData(prev => ({
                                    ...prev,
                                    password: '',
                                    confirmPassword: ''
                                }));
                            }}
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
            </div>
        </div>
    );
}

export default AnalistaProfile;
