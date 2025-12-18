/**
 * ComentariosList.jsx
 * Lista de comentarios e historial del ticket
 * Parte de la modularización de ComentariosTicket.jsx
 */

import React from 'react';

// Componente para item de historial (movimiento del sistema)
const HistorialItem = ({ movimiento }) => (
    <div className="timeline-item mb-4">
        <div className="d-flex">
            <div className="flex-shrink-0 me-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center bg-info text-white avatar-comment">
                    <i className="fas fa-cog"></i>
                </div>
            </div>
            <div className="flex-grow-1">
                <div className="card border-info">
                    <div className="card-header d-flex justify-content-between align-items-center py-2 bg-info text-white">
                        <div>
                            <strong>Sistema</strong>
                            <small className="ms-2">(movimiento automático)</small>
                        </div>
                        <small>
                            {new Date(movimiento.fecha_comentario).toLocaleString()}
                        </small>
                    </div>
                    <div className="card-body py-2">
                        <p className="mb-0">{movimiento.texto}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Componente para item de comentario
const ComentarioItem = ({ comentario, getRoleColor, getRoleIcon }) => (
    <div className="timeline-item mb-4">
        <div className="d-flex">
            <div className="flex-shrink-0 me-3">
                <div className={`rounded-circle d-flex align-items-center justify-content-center avatar-comment ${getRoleColor(comentario.autor?.rol)}`}>
                    <i className={getRoleIcon(comentario.autor?.rol)}></i>
                </div>
            </div>
            <div className="flex-grow-1">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center py-2">
                        <div>
                            <strong className={getRoleColor(comentario.autor?.rol)}>
                                {comentario.autor?.nombre || 'Sistema'}
                            </strong>
                            <small className="text-muted ms-2">
                                ({comentario.autor?.rol || 'sistema'})
                            </small>
                        </div>
                        <small className="text-muted">
                            {new Date(comentario.fecha_comentario).toLocaleString()}
                        </small>
                    </div>
                    <div className="card-body py-2">
                        <p className="mb-0">{comentario.texto}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Componente principal de lista
const ComentariosList = ({
    comentarios,
    historialTicket,
    mostrarHistorial,
    setMostrarHistorial,
    esTicketCerrado,
    getRoleColor,
    getRoleIcon
}) => {
    return (
        <>
            {/* Botones de navegación */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="btn-group w-100" role="group">
                        <button
                            className={`btn ${!mostrarHistorial ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setMostrarHistorial(false)}
                        >
                            <i className="fas fa-comments me-2"></i>
                            {esTicketCerrado ? 'Comentarios y Chats' : 'Historial de Comentarios'} ({comentarios.length})
                        </button>
                        <button
                            className={`btn ${mostrarHistorial ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setMostrarHistorial(true)}
                        >
                            <i className="fas fa-history me-2"></i>
                            Historial del Ticket ({historialTicket.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de comentarios o historial */}
            <div className="card">
                <div className="card-header">
                    <h5 className="mb-0">
                        <i className={`fas ${mostrarHistorial ? 'fa-history' : 'fa-comments'} me-2`}></i>
                        {mostrarHistorial ? 'Historial del Ticket' : (esTicketCerrado ? 'Comentarios y Chats (Solo Lectura)' : 'Historial de Comentarios')}
                    </h5>
                </div>
                <div className="card-body">
                    {mostrarHistorial ? (
                        // Mostrar historial del ticket
                        historialTicket.length === 0 ? (
                            <div className="text-center text-muted py-4">
                                <i className="fas fa-history fa-3x mb-3"></i>
                                <p>No hay movimientos registrados para este ticket</p>
                            </div>
                        ) : (
                            <div className="timeline">
                                {historialTicket.map((movimiento) => (
                                    <HistorialItem key={movimiento.id} movimiento={movimiento} />
                                ))}
                            </div>
                        )
                    ) : (
                        // Mostrar comentarios normales
                        comentarios.length === 0 ? (
                            <div className="text-center text-muted py-4">
                                <i className="fas fa-comment-slash fa-3x mb-3"></i>
                                <p>{esTicketCerrado ? 'No hay comentarios o chats registrados para este ticket cerrado' : 'No hay comentarios para este ticket'}</p>
                                {esTicketCerrado && (
                                    <small className="text-info">
                                        <i className="fas fa-info-circle me-1"></i>
                                        Esta vista muestra el historial completo de comunicaciones del ticket
                                    </small>
                                )}
                            </div>
                        ) : (
                            <div className="timeline">
                                {comentarios.map((comentario) => (
                                    <ComentarioItem
                                        key={comentario.id}
                                        comentario={comentario}
                                        getRoleColor={getRoleColor}
                                        getRoleIcon={getRoleIcon}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </>
    );
};

export default ComentariosList;
