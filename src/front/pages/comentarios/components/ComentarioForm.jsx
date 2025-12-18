/**
 * ComentarioForm.jsx
 * Formulario para agregar nuevos comentarios
 * Parte de la modularización de ComentariosTicket.jsx
 */

import React from 'react';

const ComentarioForm = ({
    nuevoComentario,
    handleTextChange,
    handleTranscription,
    agregarComentario,
    limpiarComentario,
    isListening,
    isPaused,
    interimTranscript,
    isSupported
}) => {
    const handleSubmit = async () => {
        const success = await agregarComentario(nuevoComentario);
        if (success) {
            limpiarComentario();
        }
    };

    return (
        <div className="card mb-4">
            <div className="card-header">
                <h5 className="mb-0">
                    <i className="fas fa-plus me-2"></i>
                    Agregar Comentario
                </h5>
            </div>
            <div className="card-body">
                <div className="mb-3">
                    <label htmlFor="nuevoComentario" className="form-label">
                        Tu comentario:
                    </label>
                    <div className="input-group">
                        <textarea
                            id="nuevoComentario"
                            className="form-control"
                            rows="3"
                            value={nuevoComentario}
                            onChange={handleTextChange}
                            placeholder="Escribe tu comentario aquí..."
                        ></textarea>
                        <button
                            type="button"
                            className={`btn ${isListening ? (isPaused ? 'btn-warning' : 'btn-danger') : 'btn-outline-primary'}`}
                            onClick={handleTranscription}
                            disabled={!isSupported}
                            title={isListening ? (isPaused ? 'Reanudar transcripción' : 'Detener transcripción') : 'Iniciar transcripción de voz'}
                        >
                            <i className={`fas ${isListening ? (isPaused ? 'fa-play' : 'fa-stop') : 'fa-microphone'}`}></i>
                            <i className="fas fa-keyboard ms-1"></i>
                        </button>
                    </div>

                    {/* Estado de transcripción */}
                    {isListening && (
                        <div className="mt-2">
                            <small className={`text-${isPaused ? 'warning' : 'success'}`}>
                                <i className={`fas fa-circle ${isPaused ? 'text-warning' : 'text-success'}`}></i>
                                {isPaused ? ' Transcripción pausada - Haz clic para reanudar' : ' Escuchando... - Haz clic para detener'}
                            </small>
                            {interimTranscript && (
                                <div className="mt-1">
                                    <small className="text-info">
                                        <i className="fas fa-microphone me-1"></i>
                                        Transcribiendo: <em>"{interimTranscript}"</em>
                                    </small>
                                    <div className="progress mt-1" style={{ height: '2px' }}>
                                        <div className="progress-bar progress-bar-striped progress-bar-animated bg-info"
                                            style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mensaje de no soporte */}
                    {!isSupported && (
                        <div className="mt-2">
                            <small className="text-muted">
                                <i className="fas fa-info-circle me-1"></i>
                                Tu navegador no soporta reconocimiento de voz
                            </small>
                        </div>
                    )}
                </div>

                {/* Botones de acción */}
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={!nuevoComentario.trim()}
                    >
                        <i className="fas fa-paper-plane me-2"></i>
                        Enviar Comentario
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={limpiarComentario}
                        disabled={!nuevoComentario.trim()}
                    >
                        <i className="fas fa-trash me-2"></i>
                        Limpiar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComentarioForm;
