import React from 'react';

/**
 * ImagePreview - Componente de presentación para mostrar imagen actual
 */
const ImagePreview = ({ imageUrl, onRemove, disabled }) => {
    return (
        <div className="current-image-container">
            <div className="d-flex align-items-center mb-2">
                <img
                    src={imageUrl}
                    alt="Imagen actual"
                    className="img-thumbnail me-3 img-preview-thumb"
                />
                <div>
                    <p className="mb-1 text-success">
                        <i className="fas fa-check-circle me-1"></i>
                        Imagen cargada
                    </p>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={onRemove}
                        disabled={disabled}
                    >
                        <i className="fas fa-trash me-1"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImagePreview;
