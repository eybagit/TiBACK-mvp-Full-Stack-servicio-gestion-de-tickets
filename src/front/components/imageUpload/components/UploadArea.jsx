import React from 'react';

/**
 * UploadArea - Componente de presentación para área de subida
 */
const UploadArea = ({ onFileSelect, disabled, uploading }) => {
    return (
        <div className="upload-area">
            <div className="border border-dashed border-secondary rounded p-4 text-center">
                <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                <p className="text-muted mb-3">
                    Arrastra una imagen aquí o haz clic para seleccionar
                </p>
                <input
                    type="file"
                    accept="image/*"
                    onChange={onFileSelect}
                    disabled={disabled || uploading}
                    className="form-control"
                    id="imageUpload"
                />
            </div>
        </div>
    );
};

export default UploadArea;
