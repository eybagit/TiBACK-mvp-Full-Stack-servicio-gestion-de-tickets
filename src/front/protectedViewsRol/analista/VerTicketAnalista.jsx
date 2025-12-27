import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

const VerTicketAnalista = () => {
    const { store, dispatch } = useGlobalReducer();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    // Usar crudSlice para estado de UI
    const selectedImageIndex = store.crud?.selectedImageIndex || 0;

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) => {
        const token = store.auth.token;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, { ...options, headers })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));
    };

    useEffect(() => {
        setLoading(true);
        fetchJson(`${API}/tickets/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: 'CRUD_SET_CURRENT_ITEM', payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));

        return () => {
            dispatch({ type: 'CRUD_RESET_FORM' });
        };
    }, [id]);

    const ticket = store.crud?.currentItem;

    const setSelectedImageIndex = (idx) => {
        dispatch({ type: 'CRUD_SET_SELECTED_IMAGE_INDEX', payload: idx });
    };

    if (store.api.error) return <div className="alert alert-danger">{store.api.error}</div>;
    if (!ticket) return <div className="alert alert-warning">Ticket no encontrado.</div>;

    return (
        <div className="container py-4">
            <h2>Detalles del Ticket #{ticket.id}</h2>
            <hr />
            <div className="row">
                <div className="col-md-6">
                    <p><strong>Cliente:</strong> {ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido}` : ticket.id_cliente}</p>
                    <p><strong>Estado:</strong> <span className="badge bg-primary">{ticket.estado}</span></p>
                    <p><strong>Prioridad:</strong> <span className="badge bg-danger">{ticket.prioridad}</span></p>
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
            </div>

            {/* Galería/carrusel de imágenes */}
            {Array.isArray(ticket.img_urls) && ticket.img_urls.length > 0 && (
                <div className="my-4">
                    <h5>Imágenes adjuntas</h5>
                    <div className="d-flex flex-column align-items-center">
                        <div className="mb-2">
                            <img
                                src={ticket.img_urls[selectedImageIndex]}
                                alt={`ticket-img-${selectedImageIndex}`}
                                className="img-preview-md rounded border"
                            />
                        </div>
                        {ticket.img_urls.length > 1 && (
                            <div className="mb-2">
                                <button className="btn btn-secondary btn-sm me-2" onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + ticket.img_urls.length) % ticket.img_urls.length)}>&lt;</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % ticket.img_urls.length)}>&gt;</button>
                            </div>
                        )}
                        <div className="d-flex gap-2">
                            {ticket.img_urls.map((url, idx) => (
                                <img
                                    key={idx}
                                    src={url}
                                    alt={`thumb-${idx}`}
                                    className={`img-thumb-sm cursor-pointer ${selectedImageIndex === idx ? 'border-primary border-2' : ''}`}
                                    onClick={() => setSelectedImageIndex(idx)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-3">
                <Link to="/analista" className="btn btn-secondary me-2">
                    <i className="fas fa-arrow-left"></i> Volver
                </Link>
            </div>
        </div>
    );
};

export default VerTicketAnalista;
