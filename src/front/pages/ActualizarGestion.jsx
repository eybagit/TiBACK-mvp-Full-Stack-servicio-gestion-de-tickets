import React, { useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarGestion = () => {
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

    const cargarGestion = () => {
        setLoading(true);
        fetchJson(`${API}/gestiones/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "gestion_set_detail", payload: data });
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

    const actualizarGestion = (e) => {
        e.preventDefault();

        // Usar FormData para obtener valores del formulario
        const formData = new FormData(e.target);
        const gestionActualizada = {
            id_ticket: formData.get('id_ticket'),
            fecha_cambio: formData.get('fecha_cambio'),
            Nota_de_caso: formData.get('Nota_de_caso')
        };

        // Validación básica
        if (!gestionActualizada.id_ticket || !gestionActualizada.fecha_cambio || !gestionActualizada.Nota_de_caso) {
            setError("Los campos Ticket, Fecha de cambio y la nota del caso son obligatorios");
            return;
        }

        setLoading(true);
        dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: true });

        fetchJson(`${API}/gestiones/${id}`, {
            method: "PUT",
            body: JSON.stringify(gestionActualizada)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "gestiones_upsert", payload: data });
            dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
        }).catch(err => {
            setError(err);
            dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: false });
        }).finally(() => setLoading(false));
    };

    // Navegación declarativa después de actualizar
    if (shouldRedirect) {
        return <Navigate to="/gestiones" replace />;
    }

    const gestion = store.gestionDetail;

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-edit me-2"></i>
                                Actualizar Gestión
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}

                            <form ref={formRef} onSubmit={actualizarGestion}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Ticket *</label>
                                        <input
                                            type="text"
                                            name="id_ticket"
                                            className="form-control"
                                            placeholder="Ingrese el ticket"
                                            defaultValue={gestion?.id_ticket || ''}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Fecha del cambio *</label>
                                        <input
                                            type="text"
                                            name="fecha_cambio"
                                            className="form-control"
                                            placeholder="Ingrese la fecha del cambio"
                                            defaultValue={gestion?.fecha_cambio || ''}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Nota del caso *</label>
                                        <input
                                            type="text"
                                            name="Nota_de_caso"
                                            className="form-control"
                                            placeholder="Ingrese la nota del caso"
                                            defaultValue={gestion?.Nota_de_caso || ''}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-2 mt-4 justify-content-end">
                                    <Link
                                        to="/gestiones"
                                        className="btn btn-secondary"
                                    >
                                        <i className="fas fa-times me-1"></i>
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        className="btn btn-warning"
                                        disabled={store.api.loading || store.crud?.formSubmitting}
                                    >
                                        <i className="fas fa-save me-1"></i>
                                        {store.api.loading ? 'Actualizando...' : 'Actualizar Gestión'}
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