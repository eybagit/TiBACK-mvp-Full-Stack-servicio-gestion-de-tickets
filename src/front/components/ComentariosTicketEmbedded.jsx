/**
 * ComentariosTicketEmbedded.jsx
 * Versión embebida del componente de comentarios - MODULARIZADO
 * 
 * Reducido de 675 líneas a ~150 líneas (-78%)
 * 
 * Reutiliza hooks y componentes de:
 * - pages/comentarios/hooks/useComentariosData.js
 * - pages/comentarios/hooks/useComentariosWebSocket.js
 * - pages/comentarios/hooks/useComentariosTranscripcion.js
 * - pages/comentarios/components/ComentarioForm.jsx
 * - pages/comentarios/components/ComentariosList.jsx
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';

// Reutilizar hooks del módulo de comentarios
import { useComentariosData, tokenUtils } from '../pages/comentarios/hooks/useComentariosData';
import { useComentariosWebSocket } from '../pages/comentarios/hooks/useComentariosWebSocket';
import { useComentariosTranscripcion } from '../pages/comentarios/hooks/useComentariosTranscripcion';

// Reutilizar componentes del módulo de comentarios
import ComentarioForm from '../pages/comentarios/components/ComentarioForm';
import ComentariosList from '../pages/comentarios/components/ComentariosList';

const ComentariosTicketEmbedded = ({ ticketId, onBack }) => {
    const { store, dispatch, joinTicketRoom, leaveTicketRoom } = useGlobalReducer();

    // Debug: Log cuando el componente se monta
    console.log('🔍 ComentariosTicketEmbedded montado con ticketId:', ticketId);

    // Hook de datos
    const {
        comentarios,
        historialTicket,
        loading,
        error,
        sincronizando,
        setSincronizando,
        userData,
        setUserData,
        lastLoadedTicketId,
        setLastLoadedTicketId,
        mostrarHistorial,
        setMostrarHistorial,
        esTicketCerrado,
        cargarDatos,
        agregarComentario,
        getRoleColor,
        getRoleIcon
    } = useComentariosData(ticketId, store);

    // Hook de transcripción
    const {
        nuevoComentario,
        isListening,
        isPaused,
        interimTranscript,
        speechError,
        isSupported,
        handleTranscription,
        handleTextChange,
        limpiarComentario
    } = useComentariosTranscripcion();

    // Hook de WebSocket
    useComentariosWebSocket({
        ticketId,
        store,
        joinTicketRoom,
        leaveTicketRoom,
        cargarDatos,
        setSincronizando
    });

    // Cargar datos iniciales
    useEffect(() => {
        if (ticketId !== lastLoadedTicketId) {
            setLastLoadedTicketId(ticketId);
            cargarDatos(true);
        }
    }, [ticketId, lastLoadedTicketId, setLastLoadedTicketId, cargarDatos]);

    // Cargar datos del usuario
    useEffect(() => {
        if (store.auth.user && store.auth.isAuthenticated) {
            setUserData(store.auth.user);
            return;
        }

        const cargarDatosUsuario = async () => {
            try {
                const token = store.auth.token;
                if (!token) return;

                const userId = tokenUtils.getUserId(token);
                const role = tokenUtils.getRole(token);
                if (!userId || !role) return;

                const endpoints = {
                    cliente: 'clientes',
                    analista: 'analistas',
                    supervisor: 'supervisores',
                    administrador: 'administradores'
                };

                const endpoint = endpoints[role];
                if (!endpoint) return;

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/${endpoint}/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                    dispatch({ type: 'SET_USER', payload: data });
                }
            } catch (err) {
                // Silently ignore
            }
        };

        if (store.auth.isAuthenticated && store.auth.token && !store.auth.user) {
            cargarDatosUsuario();
        }
    }, [store.auth.isAuthenticated, store.auth.token, store.auth.user, dispatch, setUserData]);

    // Loading state
    if (loading) {
        console.log('⏳ ComentariosTicketEmbedded: Cargando datos...');
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        );
    }

    console.log('✅ ComentariosTicketEmbedded: Renderizando contenido', {
        comentarios: comentarios.length,
        historialTicket: historialTicket.length,
        ticketId
    });

    return (
        <div className="container-fluid py-4">
            {/* Header del Ticket */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <button className="btn btn-outline-secondary" onClick={onBack}>
                                <i className="fas fa-arrow-left me-2"></i>Volver
                            </button>
                            <div>
                                <div className="d-flex align-items-center gap-3">
                                    <h1 className="mb-0 fw-bold">Comentarios - Ticket #{ticketId}</h1>
                                    <Link
                                        to={`/ticket/${ticketId}/recomendaciones-ia`}
                                        className="btn btn-outline-warning btn-sm"
                                        title="Ver recomendaciones guardadas de IA"
                                    >
                                        <i className="fas fa-robot me-1"></i>
                                        Recomendaciones IA
                                    </Link>
                                </div>
                                <p className="text-muted mb-0">Vista de comentarios del ticket</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-12">
                    {/* Header con título y estado */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center">
                            <h2>
                                <i className="fas fa-comments me-2"></i>
                                {esTicketCerrado ? 'Historial del Ticket Cerrado' : 'Comentarios del Ticket'} #{ticketId}
                                {esTicketCerrado && (
                                    <span className="badge bg-dark ms-2">
                                        <i className="fas fa-lock me-1"></i>Solo Lectura
                                    </span>
                                )}
                            </h2>
                            {sincronizando && (
                                <div className="ms-3">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                        <span className="visually-hidden">Sincronizando...</span>
                                    </div>
                                    <small className="text-muted ms-2">Sincronizando...</small>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alertas de error */}
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>{error}
                        </div>
                    )}
                    {speechError && (
                        <div className="alert alert-warning" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>{speechError}
                        </div>
                    )}

                    {/* Formulario de comentarios */}
                    {!esTicketCerrado && (
                        <ComentarioForm
                            nuevoComentario={nuevoComentario}
                            handleTextChange={handleTextChange}
                            handleTranscription={handleTranscription}
                            agregarComentario={agregarComentario}
                            limpiarComentario={limpiarComentario}
                            isListening={isListening}
                            isPaused={isPaused}
                            interimTranscript={interimTranscript}
                            isSupported={isSupported}
                        />
                    )}

                    {/* Lista de comentarios */}
                    <ComentariosList
                        comentarios={comentarios}
                        historialTicket={historialTicket}
                        mostrarHistorial={mostrarHistorial}
                        setMostrarHistorial={setMostrarHistorial}
                        esTicketCerrado={esTicketCerrado}
                        getRoleColor={getRoleColor}
                        getRoleIcon={getRoleIcon}
                    />
                </div>
            </div>
        </div>
    );
};

export default ComentariosTicketEmbedded;
