import React from 'react';

const InfoFormModal = ({
    infoData,
    setInfoData,
    setShowInfoForm,
    actualizarInformacion,
    updatingInfo
}) => {
    return (
        <div className="modal show d-block modal-backdrop-light">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Actualizar Información</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowInfoForm(false)}
                        ></button>
                    </div>
                    <form onSubmit={actualizarInformacion}>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Nombre</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={infoData.nombre}
                                            onChange={(e) => setInfoData({ ...infoData, nombre: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Apellido</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={infoData.apellido}
                                            onChange={(e) => setInfoData({ ...infoData, apellido: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={infoData.email}
                                    onChange={(e) => setInfoData({ ...infoData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Área Responsable</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={infoData.area_responsable}
                                    onChange={(e) => setInfoData({ ...infoData, area_responsable: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Nueva Contraseña (opcional)</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={infoData.password}
                                    onChange={(e) => setInfoData({ ...infoData, password: e.target.value })}
                                />
                            </div>
                            {infoData.password && (
                                <div className="mb-3">
                                    <label className="form-label">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={infoData.confirmPassword}
                                        onChange={(e) => setInfoData({ ...infoData, confirmPassword: e.target.value })}
                                        required={infoData.password}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowInfoForm(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={updatingInfo}
                            >
                                {updatingInfo ? 'Actualizando...' : 'Actualizar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InfoFormModal;
