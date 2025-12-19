import React, { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const VerComentarios = () => {
    const { store, dispatch } = useGlobalReducer();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    // Estado del store para navegación después de eliminar
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

    const cargarComentario = () => {
        setLoading(true);
        fetchJson(`${API}/comentarios/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "comentario_set_detail", payload: data });
            }).catch(setError).finally(() => setLoading(false));
    };

    const eliminarComentario = () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este comentario?")) return;

        setLoading(true);
        fetchJson(`${API}/comentarios/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "comentarios_remove", payload: parseInt(id) });
                dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
            }).catch(setError).finally(() => setLoading(false));
    };

    useEffect(() => {
        if (id) {
            cargarComentario();
        }
        // Limpiar estado al desmontar
        return () => {
            dispatch({ type: 'CRUD_RESET_FORM' });
        };
    }, [id]);

    // Navegación declarativa después de eliminar
    if (shouldRedirect) {
        return <Navigate to="/comentarios" replace />;
    }

    const comentario = store.comentarioDetail;

    if (!comentario && !store.api.loading) {
        return (
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card">
                            <div className="card-body text-center">
                                <h5>Comentario no encontrado</h5>
                                <Link to="/comentarios" className="btn btn-primary">
                                    Volver a la lista
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-comment me-2"></i>
                                Detalles del Comentario
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            {comentario && (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">ID:</label>
                                        <p className="form-control-plaintext">{comentario.id}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">ID Gestión:</label>
                                        <p className="form-control-plaintext">{comentario.id_gestion}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">ID Cliente:</label>
                                        <p className="form-control-plaintext">{comentario.id_cliente}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">ID Analista:</label>
                                        <p className="form-control-plaintext">{comentario.id_analista}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">ID Supervisor:</label>
                                        <p className="form-control-plaintext">{comentario.id_supervisor}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Fecha del Comentario:</label>
                                        <p className="form-control-plaintext">{comentario.fecha_comentario}</p>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Texto del Comentario:</label>
                                        <div className="form-control-plaintext border p-3 bg-light rounded">
                                            {comentario.texto}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="d-flex gap-2 mt-4 justify-content-between">
                                <Link
                                    to="/comentarios"
                                    className="btn btn-secondary"
                                >
                                    <i className="fas fa-arrow-left me-1"></i>
                                    Volver
                                </Link>

                                <div className="d-flex gap-2">
                                    <Link
                                        to={`/actualizar-comentario/${id}`}
                                        className="btn btn-warning"
                                    >
                                        <i className="fas fa-edit me-1"></i>
                                        Editar
                                    </Link>
                                    <button
                                        className="btn btn-danger"
                                        onClick={eliminarComentario}
                                        disabled={store.api.loading}
                                    >
                                        <i className="fas fa-trash me-1"></i>
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};