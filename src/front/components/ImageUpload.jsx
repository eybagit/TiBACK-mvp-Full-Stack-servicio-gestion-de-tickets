import React from 'react';
import { useImageUpload, useScreenCapture } from './imageUpload/hooks';
import { ImagePreview, UploadArea, CaptureButtons } from './imageUpload/components';

/**
 * ImageUpload - Componente principal para subida de imágenes
 * Modularizado según documentacion/modular.md
 */
const ImageUpload = ({ onImageUpload, onImageRemove, currentImageUrl, disabled = false }) => {
    // Hook para manejo de subida de imágenes
    const {
        uploading,
        error,
        setError,
        uploadImage,
        handleFileSelect,
        testCloudinaryConfig
    } = useImageUpload({ onImageUpload });

    // Hook para captura de pantalla
    const {
        capturing,
        showDesktopCapture,
        handleScreenCapture,
        handleDesktopCapture
    } = useScreenCapture({ uploadImage });

    return (
        <div className="image-upload-container">
            <div className="mb-3">
                <label className="form-label">
                    <i className="fas fa-image me-2"></i>
                    Imagen
                </label>

                {currentImageUrl ? (
                    <ImagePreview
                        imageUrl={currentImageUrl}
                        onRemove={onImageRemove}
                        disabled={disabled}
                    />
                ) : (
                    <UploadArea
                        onFileSelect={handleFileSelect}
                        disabled={disabled}
                        uploading={uploading}
                    />
                )}

                {uploading && (
                    <div className="mt-2">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Subiendo...</span>
                        </div>
                        <span className="text-muted">Subiendo imagen...</span>
                    </div>
                )}

                {error && (
                    <div className={`alert ${error.includes('placeholder') || error.includes('✅') ? 'alert-warning' : 'alert-danger'} mt-2`} role="alert">
                        <i className={`fas ${error.includes('placeholder') || error.includes('✅') ? 'fa-info-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                        {error}
                    </div>
                )}

                <div className="form-text">
                    <i className="fas fa-info-circle me-1"></i>
                    Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB.
                </div>

                <div className="form-text small text-muted">
                    <i className="fas fa-camera me-1"></i>
                    <strong>Capturar Pantalla:</strong> Ventana o pestaña específica
                    <br />
                    <i className="fas fa-desktop me-1"></i>
                    <strong>Capturar Escritorio:</strong> Pantalla completa con cuenta regresiva
                </div>

                <CaptureButtons
                    disabled={disabled}
                    capturing={capturing}
                    showDesktopCapture={showDesktopCapture}
                    onScreenCapture={() => handleScreenCapture(setError)}
                    onDesktopCapture={() => handleDesktopCapture(setError)}
                    onTestCloudinary={testCloudinaryConfig}
                />
            </div>
        </div>
    );
};

export default ImageUpload;
