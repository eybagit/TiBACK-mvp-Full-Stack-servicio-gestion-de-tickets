import React from 'react';
import GoogleMapsLocation from '../../../components/GoogleMapsLocation';
import ImageUpload from '../../../components/ImageUpload';

/**
 * ClienteProfile - Vista de perfil del cliente
 */
function ClienteProfile({
    infoData,
    handleInfoChange,
    handleLocationChange,
    handleClienteImageUpload,
    handleClienteImageRemove,
    clienteImageUrl,
    userData,
    updateInfo,
    updatingInfo,
    setShowInfoForm
}) {
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
                        <label htmlFor="telefono" className="form-label">Teléfono *</label>
                        <input
                            type="tel"
                            className="form-control"
                            id="telefono"
                            name="telefono"
                            value={infoData.telefono}
                            onChange={handleInfoChange}
                            placeholder="Ingresa tu teléfono"
                            required
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">Ubicación *</label>
                        <GoogleMapsLocation
                            onLocationChange={handleLocationChange}
                            initialAddress={infoData.direccion}
                            initialLat={infoData.lat}
                            initialLng={infoData.lng}
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">Imagen de Perfil</label>
                        <ImageUpload
                            onImageUpload={handleClienteImageUpload}
                            onImageRemove={handleClienteImageRemove}
                            currentImageUrl={clienteImageUrl || userData?.url_imagen}
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
                            minLength="6"
                            placeholder="Dejar vacío para mantener la actual"
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="confirmPassword" className="form-label">Confirmar Nueva Contraseña</label>
                        <input
                            type="password"
                            className="form-control"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={infoData.confirmPassword}
                            onChange={handleInfoChange}
                            minLength="6"
                            placeholder="Solo si cambias la contraseña"
                        />
                    </div>
                </div>
                <div className="mt-3 d-flex gap-2">
                    <button
                        className="btn btn-success"
                        onClick={updateInfo}
                        disabled={!infoData.nombre || !infoData.apellido || !infoData.email || !infoData.telefono || !infoData.direccion || updatingInfo}
                    >
                        {updatingInfo ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Actualizando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save me-1"></i>
                                Guardar Información
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowInfoForm(false)}
                        disabled={updatingInfo}
                    >
                        <i className="fas fa-times me-1"></i>
                        Cancelar
                    </button>
                </div>
            </div>
        </>
    );
}

export default ClienteProfile;
