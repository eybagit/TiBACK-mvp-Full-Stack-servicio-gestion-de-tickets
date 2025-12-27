import React, { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const VerGestion = () => {
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

    const cargarGestion = () => {
        setLoading(true);
        fetchJson(`${API}/gestiones/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "gestion_set_detail", payload: data });
            }).catch(setError).finally(() => setLoading(false));
    };

    const eliminarGestion = () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta gestión?")) return;

        setLoading(true);
        fetchJson(`${API}/gestiones/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "gestiones_remove", payload: parseInt(id) });
                dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
            }).catch(setError).finally(() => setLoading(false));
    };

    useEffect(() => {
        if (id) {
            cargarGestion();
        }
        // Limpiar estado al desmontar
        return () => {
            dispatch({ type: 'CRUD_RESET_FORM' });
        };
    }, [id]);

    // Navegación declarativa después de eliminar
    if (shouldRedirect) {
        return <Navigate to="/gestiones" replace />;
    }

    const gestion = store.gestionDetail;

    if (!gestion && !store.api.loading) {
        return (
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card">
                            <div className="card-body text-center">
                                <h5>Gestión no encontrada</h5>
                                <Link to="/gestiones" className="btn btn-primary">
                                    Volver al inicio
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
                                <i className="fas fa-user me-2"></i>
                                Detalles de la Gestión
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}

                            {gestion && (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Ticket:</label>
                                        <p className="form-control-plaintext">{gestion.id_ticket}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Fecha del cambio:</label>
                                        <p className="form-control-plaintext">{gestion.fecha_cambio}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Nota del caso:</label>
                                        <p className="form-control-plaintext">{gestion.Nota_de_caso}</p>
                                    </div>
                                </div>
                            )}

                            <div className="d-flex gap-2 mt-4 justify-content-between">
                                <Link
                                    to="/gestiones"
                                    className="btn btn-secondary"
                                >
                                    <i className="fas fa-arrow-left me-1"></i>
                                    Volver
                                </Link>

                                <div className="d-flex gap-2">
                                    <Link
                                        to={`/actualizar-gestion/${id}`}
                                        className="btn btn-warning"
                                    >
                                        <i className="fas fa-edit me-1"></i>
                                        Editar
                                    </Link>
                                    <button
                                        className="btn btn-danger"
                                        onClick={eliminarGestion}
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