import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const VerTicket = () => {
    const { store, dispatch, joinTicketRoom, leaveTicketRoom } = useGlobalReducer();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    // Leer estados del store (en lugar de useState)
    const { showModal, selectedImageIndex } = store.crud;

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

    const cargarTicket = () => {
        setLoading(true);
        fetchJson(`${API}/tickets/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "ticket_set_detail", payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (id && (!store.ticketDetail || store.ticketDetail.id !== parseInt(id))) {
            cargarTicket();
        }
    }, [id]);

    // Efecto para unirse al room del ticket cuando se carga
    useEffect(() => {
        if (id && store.websocket.socket && store.websocket.connected) {
            // Unirse al room del ticket
            joinTicketRoom(store.websocket.socket, parseInt(id));

            // Cleanup: salir del room cuando el componente se desmonte
            return () => {
                leaveTicketRoom(store.websocket.socket, parseInt(id));
            };
        }
    }, [id, store.websocket.socket, store.websocket.connected, joinTicketRoom, leaveTicketRoom]);

    // Limpiar estado CRUD al desmontar
    useEffect(() => {
        return () => {
            dispatch({ type: 'CRUD_CLOSE_MODAL' });
        };
    }, []);

    const getEstadoClase = (estado) => {
        switch (estado?.toLowerCase()) {
            case "creado":
                return "badge bg-secondary";
            case "recibido":
                return "badge bg-info";
            case "en_espera":
                return "badge bg-warning";
            case "en_proceso":
                return "badge bg-primary";
            case "solucionado":
                return "badge bg-success";
            case "cerrado":
                return "badge bg-dark";
            case "reabierto":
                return "badge bg-danger";
            default:
                return "badge bg-light text-dark";
        }
    };

    const getPrioridadClase = (prioridad) => {
        switch (prioridad?.toLowerCase()) {
            case "alta":
                return "badge bg-danger";
            case "media":
                return "badge bg-warning";
            case "baja":
                return "badge bg-success";
            default:
                return "badge bg-light text-dark";
        }
    };

    // Funciones de modal usando dispatch en lugar de setState
    const openImageModal = (index) => {
        dispatch({ type: 'CRUD_OPEN_IMAGE_MODAL', payload: index });
    };

    const closeModal = () => {
        dispatch({ type: 'CRUD_CLOSE_MODAL' });
    };

    const nextImage = (total) => {
        dispatch({ type: 'CRUD_SET_SELECTED_IMAGE_INDEX', payload: (selectedImageIndex + 1) % total });
    };

    const prevImage = (total) => {
        dispatch({ type: 'CRUD_SET_SELECTED_IMAGE_INDEX', payload: (selectedImageIndex - 1 + total) % total });
    };

    const ticket = store.ticketDetail;

    if (store.api.error) return <div className="alert alert-danger">{store.api.error}</div>;
    if (!ticket) return <div className="alert alert-warning">Ticket no encontrado.</div>;

    return (
        <div className="container py-4">
            <h2>Detalles del Ticket #{ticket.id}</h2>
            <hr />
            <div className="row">
                <div className="col-md-6">
                    <p><strong>Cliente:</strong> {ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido}` : ticket.id_cliente}</p>
                    <p><strong>Estado:</strong> <span className={getEstadoClase(ticket.estado)}>{ticket.estado}</span></p>
                    <p><strong>Prioridad:</strong> <span className={getPrioridadClase(ticket.prioridad)}>{ticket.prioridad}</span></p>
                </div>
                <div className="col-md-6">
                    <p><strong>Título:</strong> {ticket.titulo}</p>
                    <p><strong>Fecha Creación:</strong> {ticket.fecha_creacion ? new Date(ticket.fecha_creacion).toLocaleString() : ''}</p>
                    <p><strong>Fecha Cierre:</strong> {ticket.fecha_cierre ? new Date(ticket.fecha_cierre).toLocaleString() : "No cerrado"}</p>
                </div>
                <div className="col-12">
                    <p><strong>Descripción:</strong> {ticket.descripcion}</p>
                    <p><strong>Comentario:</strong> {ticket.comentario || "Sin comentarios"}</p>
                </div>
                {ticket.url_imagen && !ticket.url_imagen.includes('placeholder.com') && !ticket.url_imagen.includes('data:image/svg+xml') && (
                    <div className="col-12">
                        <p><strong>Imagen:</strong></p>
                        <div className="text-center">
                            <img
                                src={ticket.url_imagen}
                                alt="Imagen del ticket"
                                className="img-fluid rounded shadow img-preview-md"
                            />
                        </div>
                    </div>
                )}
            </div>


            {/* Miniaturas de imágenes, visible para todos los roles */}
            {Array.isArray(ticket.img_urls) && ticket.img_urls.length > 0 && (
                <div className="my-4">
                    <h5>Imágenes adjuntas</h5>
                    <div className="d-flex gap-2 flex-wrap">
                        {ticket.img_urls.map((url, idx) => (
                            <img
                                key={idx}
                                src={url}
                                alt={`thumb-${idx}`}
                                className="img-thumb-md cursor-pointer"
                                onClick={() => openImageModal(idx)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Modal con carrusel */}
            {showModal && Array.isArray(ticket.img_urls) && ticket.img_urls.length > 0 && (
                <div className="modal fade show modal-backdrop-dark" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Imagen {selectedImageIndex + 1} de {ticket.img_urls.length}</h5>
                                <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body d-flex flex-column align-items-center">
                                <img
                                    src={ticket.img_urls[selectedImageIndex]}
                                    alt={`ticket-img-${selectedImageIndex}`}
                                    className="img-preview-md rounded border"
                                />
                                {ticket.img_urls.length > 1 && (
                                    <div className="mt-3">
                                        <button className="btn btn-secondary btn-sm me-2" onClick={() => prevImage(ticket.img_urls.length)}>&lt;</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => nextImage(ticket.img_urls.length)}>&gt;</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-3">
                <Link to="/tickets" className="btn btn-secondary me-2">
                    <i className="fas fa-arrow-left"></i> Volver
                </Link>
                <Link to={`/actualizar-ticket/${ticket.id}`} className="btn btn-warning">
                    <i className="fas fa-edit"></i> Editar
                </Link>
            </div>
        </div>
    );
};