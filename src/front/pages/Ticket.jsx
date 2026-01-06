import React, { useState, useEffect } from "react";
import { TICKET_STATES } from '../constants/ticketEnums';
import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

// Utilidades de token seguras
const tokenUtils = {
    decodeToken: (token) => {
        try {
            if (!token) return null;
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            return JSON.parse(atob(parts[1]));
        } catch (error) {
            return null;
        }
    },
    getUserId: (token) => {
        const payload = tokenUtils.decodeToken(token);
        return payload ? payload.user_id : null;
    },
    getRole: (token) => {
        const payload = tokenUtils.decodeToken(token);
        return payload ? payload.role : null;
    }
};

export const Ticket = () => {
    const { store, dispatch, connectWebSocket, disconnectWebSocket, joinRoom } = useGlobalReducer();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    // Usar crudSlice para el modal de imágenes
    const showModal = store.crud?.showModal || false;
    const modalImages = store.crud?.modalImages || [];
    const selectedImageIndex = store.crud?.selectedImageIndex || 0;

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) => {
        const token = store.auth.token;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch(url, {
            ...options,
            headers
        })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));
    };

    const listarTodosLosTickets = () => {
        setLoading(true);
        fetchJson(`${API}/tickets`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_set_list", payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    const eliminarTicket = (id) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este ticket?")) return;

        setLoading(true);
        fetchJson(`${API}/tickets/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_remove", payload: parseInt(id) });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    const borrarTodosLosTickets = () => {
        const totalTickets = Array.isArray(store.tickets) ? store.tickets.length : 0;

        if (totalTickets === 0) {
            alert("No hay tickets para borrar");
            return;
        }

        const confirmacion1 = window.confirm(
            `⚠️ ADVERTENCIA: Estás a punto de borrar TODOS los ${totalTickets} tickets.\n\n` +
            `Esta acción NO se puede deshacer.\n\n` +
            `¿Estás seguro de que quieres continuar?`
        );

        if (!confirmacion1) return;

        const confirmacion2 = window.confirm(
            `🚨 CONFIRMACIÓN FINAL:\n\n` +
            `Se borrarán ${totalTickets} tickets de forma PERMANENTE.\n\n` +
            `Escribe OK mentalmente y presiona Aceptar para confirmar.`
        );

        if (!confirmacion2) return;

        setLoading(true);
        fetchJson(`${API}/tickets/borrar-todos`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_set_list", payload: [] });
                alert(`✅ ${data.deleted_count || totalTickets} tickets eliminados exitosamente`);
            })
            .catch((error) => {
                setError(error);
                alert(`❌ Error al borrar tickets: ${error.message || error}`);
            })
            .finally(() => setLoading(false));
    };

    // Control del modal mediante dispatch
    const openModal = (images) => {
        dispatch({ type: 'CRUD_SET_MODAL_IMAGES', payload: images });
        dispatch({ type: 'CRUD_SET_SELECTED_IMAGE_INDEX', payload: 0 });
        dispatch({ type: 'CRUD_SET_SHOW_MODAL', payload: true });
    };

    const closeModal = () => {
        dispatch({ type: 'CRUD_SET_SHOW_MODAL', payload: false });
    };

    const nextImage = () => {
        dispatch({ type: 'CRUD_SET_SELECTED_IMAGE_INDEX', payload: (selectedImageIndex + 1) % modalImages.length });
    };

    const prevImage = () => {
        dispatch({ type: 'CRUD_SET_SELECTED_IMAGE_INDEX', payload: (selectedImageIndex - 1 + modalImages.length) % modalImages.length });
    };

    // Conectar WebSocket cuando el usuario esté autenticado
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token && !store.websocket.connected) {
            const socket = connectWebSocket(store.auth.token);
            if (socket) {
                const userId = tokenUtils.getUserId(store.auth.token);
                const role = tokenUtils.getRole(store.auth.token);
                joinRoom(socket, role, userId);
            }
        }

        // Cleanup al desmontar
        return () => {
            if (store.websocket.socket) {
                disconnectWebSocket(store.websocket.socket);
            }
        };
    }, [store.auth.isAuthenticated, store.auth.token]);

    // Actualizar lista de tickets cuando lleguen notificaciones WebSocket
    useEffect(() => {
        if (store.websocket.notifications.length > 0) {
            const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];
            console.log('🔔 TICKETS - Notificación recibida:', lastNotification);

            // Si es un evento relacionado con tickets, recargar la lista
            if (lastNotification.tipo === TICKET_STATES.CREADO ||
                lastNotification.tipo === 'actualizado' ||
                lastNotification.tipo === 'asignado' ||
                lastNotification.tipo === 'eliminado' ||
                lastNotification.tipo === 'ticket_creado') {
                console.log('⚡ TICKETS - Recargando lista por notificación:', lastNotification.tipo);
                listarTodosLosTickets();
            }
        }
    }, [store.websocket.notifications]);

    useEffect(() => {
        if (!store.tickets || store.tickets.length === 0) {
            listarTodosLosTickets();
        }
    }, []);

    const getEstadoBadgeClass = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'creado': return 'badge bg-secondary';
            case 'recibido': return 'badge bg-info';
            case 'en_espera': return 'badge bg-warning';
            case 'en_proceso': return 'badge bg-primary';
            case 'solucionado': return 'badge bg-success';
            case 'cerrado': return 'badge bg-dark';
            case 'reabierto': return 'badge bg-danger';
            default: return 'badge bg-light text-dark';
        }
    };

    const getPrioridadBadgeClass = (prioridad) => {
        switch (prioridad?.toLowerCase()) {
            case 'alta': return 'badge bg-danger';
            case 'media': return 'badge bg-warning';
            case 'baja': return 'badge bg-success';
            default: return 'badge bg-light text-dark';
        }
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-0">Gestión de Tickets</h2>
                    {store.websocket.connected && (
                        <div className="d-flex align-items-center mt-1">
                            <span className="badge bg-success me-2">
                                <i className="fas fa-wifi me-1"></i>
                                Conectado
                            </span>
                        </div>
                    )}
                </div>
                <Link to="/administrador" className="btn btn-secondary">Volver</Link>
            </div>

            {store?.api?.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            <div className="d-flex justify-content-end mb-3">
                <Link to="/tickets/nuevo" className="btn btn-primary">
                    <i className="fas fa-plus"></i> Nuevo Ticket
                </Link>
            </div>

            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Lista de Tickets</h5>
                    <div className="d-flex gap-2">
                        <button className="btn btn-primary" onClick={listarTodosLosTickets}>
                            <i className="fas fa-refresh"></i> Actualizar Lista
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={borrarTodosLosTickets}
                            disabled={!Array.isArray(store.tickets) || store.tickets.length === 0}
                        >
                            <i className="fas fa-trash"></i> Borrar Todos
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    {Array.isArray(store.tickets) && store.tickets.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Cliente</th>
                                        <th>Imagen</th>
                                        <th>Estado</th>
                                        <th>Título</th>
                                        <th>Prioridad</th>
                                        <th>Fecha Creación</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {store.tickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td>
                                                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-1 gap-sm-2">
                                                    <span className="fw-semibold">#{ticket.id}</span>
                                                    {ticket.url_imagen ? (
                                                        <img
                                                            src={ticket.url_imagen}
                                                            alt="Imagen del ticket"
                                                            className="img-thumbnail img-thumb-xs"
                                                            style={{ maxWidth: '40px', maxHeight: '40px' }}
                                                        />
                                                    ) : (
                                                        <span className="text-muted">
                                                            <i className="fas fa-image icon-tiny"></i>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido}` : ticket.id_cliente}
                                            </td>
                                            <td>
                                                {Array.isArray(ticket.img_urls) && ticket.img_urls.length > 0 ? (
                                                    <img
                                                        src={ticket.img_urls[0]}
                                                        alt={`ticket-${ticket.id}-img`}
                                                        className="img-thumb-sm cursor-pointer"
                                                        onClick={() => openModal(ticket.img_urls)}
                                                    />
                                                ) : (
                                                    <span className="text-muted">Sin imagen</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={getEstadoBadgeClass(ticket.estado)}>{ticket.estado}</span>
                                            </td>
                                            <td className="text-truncate-cell">
                                                {ticket.titulo}
                                            </td>
                                            <td>
                                                <span className={getPrioridadBadgeClass(ticket.prioridad)}>{ticket.prioridad}</span>
                                            </td>
                                            <td>{ticket.fecha_creacion ? new Date(ticket.fecha_creacion).toLocaleString() : ''}</td>
                                            <td>
                                                <div className="d-flex flex-column flex-sm-row gap-2">
                                                    <Link
                                                        to={`/ver-ticket/${ticket.id}`}
                                                        className="btn btn-info btn-sm"
                                                        title="Ver Ticket"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </Link>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        title="Eliminar Ticket"
                                                        onClick={() => eliminarTicket(ticket.id)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-muted">No hay tickets registrados.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de imágenes con carrusel */}
            {showModal && Array.isArray(modalImages) && modalImages.length > 0 && (
                <div className="modal fade show modal-backdrop-dark" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Imagen {selectedImageIndex + 1} de {modalImages.length}</h5>
                                <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body d-flex flex-column align-items-center">
                                <img
                                    src={modalImages[selectedImageIndex]}
                                    alt={`ticket-img-${selectedImageIndex}`}
                                    className="img-preview-md rounded border"
                                />
                                {modalImages.length > 1 && (
                                    <div className="mt-3">
                                        <button className="btn btn-secondary btn-sm me-2" onClick={prevImage}>&lt;</button>
                                        <button className="btn btn-secondary btn-sm" onClick={nextImage}>&gt;</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
