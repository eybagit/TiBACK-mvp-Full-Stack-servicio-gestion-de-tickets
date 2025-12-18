/**
 * ComentariosHeader.jsx
 * Header del componente de comentarios
 * Parte de la modularización de ComentariosTicket.jsx
 */

import React from 'react';
import { Link } from 'react-router-dom';

const ComentariosHeader = ({
    ticketId,
    esTicketCerrado,
    sincronizando,
    error,
    speechError,
    onNavigateBack
}) => {
    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <h2>
                        <i className="fas fa-comments me-2"></i>
                        {esTicketCerrado ? 'Historial del Ticket Cerrado' : 'Comentarios del Ticket'} #{ticketId}
                        {esTicketCerrado && (
                            <span className="badge bg-dark ms-2">
                                <i className="fas fa-lock me-1"></i>
                                Solo Lectura
                            </span>
                        )}
                    </h2>
                    <div className="d-flex gap-2 ms-3">
                        <Link
                            to={`/ticket/${ticketId}/recomendaciones-ia`}
                            className="btn btn-outline-info btn-sm"
                            title="Ver recomendaciones guardadas de IA"
                        >
                            <i className="fas fa-robot me-1"></i>
                            Ver recomendaciones guardadas IA
                        </Link>
                    </div>
                    {sincronizando && (
                        <div className="ms-3">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Sincronizando...</span>
                            </div>
                            <small className="text-muted ms-2">Sincronizando...</small>
                        </div>
                    )}
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={onNavigateBack}
                >
                    <i className="fas fa-arrow-left me-2"></i>
                    Volver
                </button>
            </div>

            {/* Alertas de error */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}

            {speechError && (
                <div className="alert alert-warning" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {speechError}
                </div>
            )}
        </>
    );
};

export default ComentariosHeader;
