import React, { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const AgregarAsignacion = () => {
    const { store, dispatch } = useGlobalReducer();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    // Estado del store para navegación después de crear
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

    // Limpiar estado al desmontar
    useEffect(() => {
        return () => {
            dispatch({ type: 'CRUD_RESET_FORM' });
        };
    }, []);

    const crearAsignacion = (e) => {
        e.preventDefault();

        // Usar FormData para obtener valores del formulario
        const formData = new FormData(e.target);

        // Validación básica
        if (!formData.get('id_ticket') || !formData.get('id_supervisor') || !formData.get('id_analista')) {
            setError("Los campos ID Ticket, ID Supervisor e ID Analista son obligatorios");
            return;
        }

        const asignacionData = {
            id_ticket: parseInt(formData.get('id_ticket')),
            id_supervisor: parseInt(formData.get('id_supervisor')),
            id_analista: parseInt(formData.get('id_analista')),
            fecha_asignacion: formData.get('fecha_asignacion')
        };

        setLoading(true);
        dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: true });

        fetchJson(`${API}/asignaciones`, {
            method: "POST",
            body: JSON.stringify(asignacionData)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "asignaciones_add", payload: data });
            dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
        }).catch(err => {
            setError(err);
            dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: false });
        }).finally(() => setLoading(false));
    };

    // Navegación declarativa después de crear
    if (shouldRedirect) {
        return <Navigate to="/asignaciones" replace />;
    }

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-plus me-2"></i>
                                Agregar Nueva Asignación
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            <form onSubmit={crearAsignacion}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">ID Ticket *</label>
                                        <input
                                            type="number"
                                            name="id_ticket"
                                            className="form-control"
                                            placeholder="Ingrese el ID del ticket"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Supervisor *</label>
                                        <input
                                            type="number"
                                            name="id_supervisor"
                                            className="form-control"
                                            placeholder="Ingrese el ID del supervisor"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Analista *</label>
                                        <input
                                            type="number"
                                            name="id_analista"
                                            className="form-control"
                                            placeholder="Ingrese el ID del analista"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Fecha de Asignación</label>
                                        <input
                                            type="date"
                                            name="fecha_asignacion"
                                            className="form-control"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-2 mt-4 justify-content-end">
                                    <Link
                                        to="/asignaciones"
                                        className="btn btn-secondary"
                                    >
                                        <i className="fas fa-times me-1"></i>
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={store.api.loading || store.crud?.formSubmitting}
                                    >
                                        <i className="fas fa-save me-1"></i>
                                        {store.api.loading ? 'Guardando...' : 'Guardar Asignación'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};