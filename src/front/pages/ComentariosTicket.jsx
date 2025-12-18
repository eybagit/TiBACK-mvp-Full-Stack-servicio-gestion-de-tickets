/**
 * ComentariosTicket.jsx
 * Componente principal de comentarios de ticket - MODULARIZADO
 * 
 * Reducido de 741 líneas a ~180 líneas (-76%)
 * 
 * Estructura modular:
 * - hooks/useComentariosData.js - Manejo de datos y estado
 * - hooks/useComentariosWebSocket.js - WebSocket y sincronización
 * - hooks/useComentariosTranscripcion.js - Transcripción de voz
 * - components/ComentarioForm.jsx - Formulario de comentarios
 * - components/ComentariosList.jsx - Lista de comentarios/historial
 * - components/ComentariosHeader.jsx - Header con título y acciones
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { SideBarCentral } from '../components/SideBarCentral';

// Hooks modularizados
import { useComentariosData, tokenUtils } from './comentarios/hooks/useComentariosData';
import { useComentariosWebSocket } from './comentarios/hooks/useComentariosWebSocket';
import { useComentariosTranscripcion } from './comentarios/hooks/useComentariosTranscripcion';

// Componentes modularizados
import ComentarioForm from './comentarios/components/ComentarioForm';
import ComentariosList from './comentarios/components/ComentariosList';
import ComentariosHeader from './comentarios/components/ComentariosHeader';

const ComentariosTicket = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { store, dispatch, joinTicketRoom, leaveTicketRoom } = useGlobalReducer();

    // Estados para el sidebar
    const [sidebarHidden, setSidebarHidden] = React.useState(false);
    const [activeView, setActiveView] = React.useState('comentarios');

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

    // Cargar datos del usuario para el sidebar
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
                console.error('Error al cargar datos del usuario:', err);
            }
        };

        if (store.auth.isAuthenticated && store.auth.token && !store.auth.user) {
            cargarDatosUsuario();
        }
    }, [store.auth.isAuthenticated, store.auth.token, store.auth.user, dispatch, setUserData]);

    // Funciones del sidebar
    const toggleSidebar = () => setSidebarHidden(!sidebarHidden);
    const changeView = (view) => {
        setActiveView(view);
        const routes = { dashboard: '/cliente', tickets: '/cliente', create: '/cliente', chat: '/cliente' };
        if (routes[view]) navigate(routes[view]);
    };

    // Loading state
    if (loading) {
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

    return (
        <div className="hyper-layout d-flex">
            <SideBarCentral
                sidebarHidden={sidebarHidden}
                activeView={activeView}
                changeView={changeView}
            />

            <div className={`hyper-main-content flex-grow-1 ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
                {/* Header superior */}
                <header className="hyper-header bg-white border-bottom p-3">
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <div className="d-flex align-items-center gap-3">
                            <button
                                className="hyper-sidebar-toggle btn btn-link p-2"
                                onClick={toggleSidebar}
                                title={sidebarHidden ? "Mostrar menú" : "Ocultar menú"}
                            >
                                <i className="fas fa-bars"></i>
                            </button>
                            <h4 className="mb-0">Comentarios del Ticket #{ticketId}</h4>
                        </div>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
                            <i className="fas fa-arrow-left me-1"></i>Volver
                        </button>
                    </div>
                </header>

                {/* Contenido principal */}
                <div className="p-4">
                    <div className="container">
                        <div className="row">
                            <div className="col-12">
                                <ComentariosHeader
                                    ticketId={ticketId}
                                    esTicketCerrado={esTicketCerrado}
                                    sincronizando={sincronizando}
                                    error={error}
                                    speechError={speechError}
                                    onNavigateBack={() => navigate(-1)}
                                />

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
                </div>
            </div>
        </div>
    );
};

export default ComentariosTicket;
