import React, { useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarAnalista = () => {
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

    const cargarAnalista = () => {
        setLoading(true);
        fetchJson(`${API}/analistas/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "analista_set_detail", payload: data });
            }).catch(setError).finally(() => setLoading(false));
    };

    useEffect(() => {
        if (id) {
            cargarAnalista();
        }
        // Limpiar estado al desmontar
        return () => {
            dispatch({ type: 'CRUD_RESET_FORM' });
        };
    }, [id]);

    const actualizarAnalista = (e) => {
        e.preventDefault();

        // Usar FormData para obtener valores del formulario
        const formData = new FormData(e.target);
        const analistaActualizado = {
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            email: formData.get('email'),
            contraseña_hash: formData.get('contraseña_hash'),
            especialidad: formData.get('especialidad')
        };

        // Validación básica
        if (!analistaActualizado.nombre || !analistaActualizado.apellido || !analistaActualizado.email || !analistaActualizado.especialidad) {
            setError("Los campos nombre, apellido, email y especialidad son obligatorios");
            return;
        }

        setLoading(true);
        dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: true });

        fetchJson(`${API}/analistas/${id}`, {
            method: "PUT",
            body: JSON.stringify(analistaActualizado)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "analistas_upsert", payload: data });
            dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
        }).catch(err => {
            setError(err);
            dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: false });
        }).finally(() => setLoading(false));
    };

    // Navegación declarativa después de actualizar
    if (shouldRedirect) {
        return <Navigate to="/analistas" replace />;
    }

    const analista = store.analistaDetail;

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-edit me-2"></i>
                                Actualizar Analista
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            <form ref={formRef} onSubmit={actualizarAnalista}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            className="form-control"
                                            placeholder="Ingrese el nombre"
                                            defaultValue={analista?.nombre || ''}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Apellido *</label>
                                        <input
                                            type="text"
                                            name="apellido"
                                            className="form-control"
                                            placeholder="Ingrese el apellido"
                                            defaultValue={analista?.apellido || ''}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Especialidad *</label>
                                        <input
                                            type="text"
                                            name="especialidad"
                                            className="form-control"
                                            placeholder="Ingrese la especialidad"
                                            defaultValue={analista?.especialidad || ''}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control"
                                            placeholder="Ingrese el email"
                                            defaultValue={analista?.email || ''}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Contraseña</label>
                                        <input
                                            type="password"
                                            name="contraseña_hash"
                                            className="form-control"
                                            placeholder="Ingrese la nueva contraseña (dejar vacío para mantener)"
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-2 mt-4 justify-content-end">
                                    <Link
                                        to="/analistas"
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
                                        {store.api.loading ? 'Actualizando...' : 'Actualizar Analista'}
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