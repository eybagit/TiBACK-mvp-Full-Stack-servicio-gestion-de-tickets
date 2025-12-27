import React, { useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarTicket = () => {
    const { store, dispatch } = useGlobalReducer();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";
    const formRef = useRef(null);

    // Estado del store para navegación después de actualizar
    const shouldRedirect = store.crud?.formSuccess;

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
        // Limpiar estado al desmontar
        return () => {
            dispatch({ type: 'CRUD_RESET_FORM' });
        };
    }, [id]);

    const manejarEnvio = (e) => {
        e.preventDefault();

        // Usar FormData para obtener valores del formulario
        const formData = new FormData(e.target);
        const ticketActualizado = {
            titulo: formData.get('titulo'),
            descripcion: formData.get('descripcion'),
            url_imagen: formData.get('url_imagen') || '',
            img_urls: store.ticketDetail?.img_urls || []
        };

        setLoading(true);
        dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: true });

        fetchJson(`${API}/tickets/${id}`, {
            method: "PUT",
            body: JSON.stringify(ticketActualizado)
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_upsert", payload: data });
                dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
            })
            .catch(err => {
                setError(err);
                dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: false });
            })
            .finally(() => setLoading(false));
    };

    // Navegación declarativa después de actualizar
    if (shouldRedirect) {
        return <Navigate to="/tickets" replace />;
    }

    const ticket = store.ticketDetail;

    if (store.api.error) return <div className="alert alert-danger">{store.api.error}</div>;
    if (!ticket) return <div className="alert alert-warning">Ticket no encontrado.</div>;

    return (
        <div className="container py-4">
            <h2>Editar Ticket #{ticket.id}</h2>
            <form ref={formRef} onSubmit={manejarEnvio}>
                <div className="mb-3">
                    <label className="form-label">Título</label>
                    <input
                        className="form-control"
                        name="titulo"
                        defaultValue={ticket.titulo}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                        className="form-control"
                        name="descripcion"
                        rows="3"
                        defaultValue={ticket.descripcion}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">URL Imagen</label>
                    <input
                        className="form-control"
                        name="url_imagen"
                        defaultValue={ticket.url_imagen || ''}
                    />
                </div>
                <button
                    className="btn btn-primary me-2"
                    type="submit"
                    disabled={store.api.loading || store.crud?.formSubmitting}
                >
                    Actualizar
                </button>
                <Link to="/tickets" className="btn btn-secondary">
                    Cancelar
                </Link>
            </form>
        </div>
    );
};