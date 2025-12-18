import React from 'react';

/**
 * CaptureButtons - Botones de captura de pantalla y escritorio
 */
const CaptureButtons = ({
    disabled,
    capturing,
    showDesktopCapture,
    onScreenCapture,
    onDesktopCapture,
    onTestCloudinary
}) => {
    return (
        <div className="mt-2 d-flex gap-2 flex-wrap">
            <button
                type="button"
                className="btn btn-sm btn-outline-info"
                onClick={onTestCloudinary}
                disabled={disabled}
            >
                <i className="fas fa-cog me-1"></i>
                Verificar Cloudinary
            </button>

            <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={onScreenCapture}
                disabled={disabled || capturing}
            >
                {capturing && !showDesktopCapture ? (
                    <>
                        <div className="spinner-border spinner-border-sm me-1" role="status">
                            <span className="visually-hidden">Capturando...</span>
                        </div>
                        Capturando...
                    </>
                ) : (
                    <>
                        <i className="fas fa-camera me-1"></i>
                        Capturar Pantalla
                    </>
                )}
            </button>

            <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={onDesktopCapture}
                disabled={disabled || capturing || showDesktopCapture}
            >
                {showDesktopCapture ? (
                    <>
                        <div className="spinner-border spinner-border-sm me-1" role="status">
                            <span className="visually-hidden">Preparando...</span>
                        </div>
                        Preparando...
                    </>
                ) : (
                    <>
                        <i className="fas fa-desktop me-1"></i>
                        Capturar Escritorio
                    </>
                )}
            </button>
        </div>
    );
};

export default CaptureButtons;
