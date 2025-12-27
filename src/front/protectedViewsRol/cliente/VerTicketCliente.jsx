import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export default function VerTicketCliente() {
    const { id } = useParams();
    const { store, dispatch } = useGlobalReducer();

    // Usar crudSlice para loading/error
    const loading = store.crud?.loading || false;
    const error = store.crud?.error || null;

    useEffect(() => {
        // Buscar primero en el store
        const found = store.tickets?.find(t => String(t.id) === String(id));
        if (found) {
            dispatch({ type: 'CRUD_SET_CURRENT_ITEM', payload: found });
            return;
        }
        // Si no está en el store, buscar en el backend
        const fetchTicket = async () => {
            try {
                dispatch({ type: 'CRUD_SET_LOADING', payload: true });
                dispatch({ type: 'CRUD_SET_ERROR', payload: null });
                const token = store.auth?.token;
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!resp.ok) throw new Error("No se pudo cargar el ticket");
                const data = await resp.json();
                dispatch({ type: 'CRUD_SET_CURRENT_ITEM', payload: data });
            } catch (err) {
                dispatch({ type: 'CRUD_SET_ERROR', payload: "Ticket no encontrado o error de conexión." });
            } finally {
                dispatch({ type: 'CRUD_SET_LOADING', payload: false });
            }
        };
        fetchTicket();
    }, [id, store.tickets, store.auth?.token, dispatch]);

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            dispatch({ type: 'CRUD_RESET_FORM' });
        };
    }, [dispatch]);

    const ticket = store.crud?.currentItem;

    if (loading) {
        return <div className="container py-4"><div>Cargando ticket...</div></div>;
    }
    if (error || !ticket) {
        return (
            <div className="container py-4">
                <div className="alert alert-warning">{error || "Ticket no encontrado."}</div>
                <Link to="/cliente" className="btn btn-secondary">Volver</Link>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h2 className="mb-4">Detalle del Ticket #{ticket.id}</h2>
            <div className="card mb-3">
                <div className="card-body">
                    <h5 className="card-title">{ticket.titulo}</h5>
                    <p className="card-text"><strong>Descripción:</strong> {ticket.descripcion}</p>
                    <p className="card-text"><strong>Estado:</strong> {ticket.estado}</p>
                    <p className="card-text"><strong>Prioridad:</strong> {ticket.prioridad}</p>
                    <p className="card-text"><strong>Fecha de creación:</strong> {ticket.fecha_creacion ? new Date(ticket.fecha_creacion).toLocaleString() : ''}</p>
                    {ticket.img_urls && ticket.img_urls.length > 0 && (
                        <div className="mb-2">
                            <strong>Imágenes:</strong>
                            <div className="d-flex flex-wrap gap-2 mt-1">
                                {ticket.img_urls.map((url, idx) => (
                                    <img key={idx} src={url} alt={`ticket-img-${idx}`} className="img-thumb-md" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Link to="/cliente" className="btn btn-secondary">
                Volver
            </Link>
        </div>
    );
}
