import React, { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const VerCliente = () => {
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

    const cargarCliente = () => {
        setLoading(true);
        fetchJson(`${API}/clientes/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "cliente_set_detail", payload: data });
            }).catch(setError).finally(() => setLoading(false));
    };

    const eliminarCliente = () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) return;

        setLoading(true);
        fetchJson(`${API}/clientes/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "clientes_remove", payload: parseInt(id) });
                dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
            }).catch(setError).finally(() => setLoading(false));
    };

    useEffect(() => {
        if (id) {
            cargarCliente();
        }
        // Limpiar estado al desmontar
        return () => {
            dispatch({ type: 'CRUD_RESET_FORM' });
        };
    }, [id]);

    // Navegación declarativa después de eliminar
    if (shouldRedirect) {
        return <Navigate to="/clientes" replace />;
    }

    const cliente = store.clienteDetail;

    if (!cliente && !store.api.loading) {
        return (
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card">
                            <div className="card-body text-center">
                                <h5>Cliente no encontrado</h5>
                                <Link to="/clientes" className="btn btn-primary">
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
                                Detalles del Cliente
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            {cliente && (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Nombre:</label>
                                        <p className="form-control-plaintext">{cliente.nombre}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Apellido:</label>
                                        <p className="form-control-plaintext">{cliente.apellido}</p>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Email:</label>
                                        <p className="form-control-plaintext">
                                            {cliente.email}
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Teléfono:</label>
                                        <p className="form-control-plaintext">
                                            {cliente.telefono}
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Dirección:</label>
                                        <p className="form-control-plaintext">
                                            {cliente.direccion || <span className="text-muted">No especificada</span>}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="d-flex gap-2 mt-4 justify-content-between">
                                <Link
                                    to="/clientes"
                                    className="btn btn-secondary"
                                >
                                    <i className="fas fa-arrow-left me-1"></i>
                                    Volver
                                </Link>

                                <div className="d-flex gap-2">
                                    <Link
                                        to={`/actualizar-cliente/${id}`}
                                        className="btn btn-warning"
                                    >
                                        <i className="fas fa-edit me-1"></i>
                                        Editar
                                    </Link>
                                    <button
                                        className="btn btn-danger"
                                        onClick={eliminarCliente}
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