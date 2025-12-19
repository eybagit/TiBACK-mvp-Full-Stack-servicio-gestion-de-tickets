import React, { useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarAdministrador = () => {
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

    const cargarAdministrador = () => {
        setLoading(true);
        fetchJson(`${API}/administradores/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "administrador_set_detail", payload: data });
            }).catch(setError).finally(() => setLoading(false));
    };

    useEffect(() => {
        if (id) {
            cargarAdministrador();
        }
        // Limpiar estado al desmontar
        return () => {
            dispatch({ type: 'CRUD_RESET_FORM' });
        };
    }, [id]);

    const actualizarAdministrador = (e) => {
        e.preventDefault();

        // Usar FormData para obtener valores del formulario
        const formData = new FormData(e.target);

        // Validación básica
        if (!formData.get('permisos_especiales') || !formData.get('email')) {
            setError("Los campos permisos especiales y email son obligatorios");
            return;
        }

        // Solo enviar contraseña si se proporcionó una nueva
        const datosActualizacion = {
            permisos_especiales: formData.get('permisos_especiales'),
            email: formData.get('email')
        };

        if (formData.get('contraseña_hash')) {
            datosActualizacion.contraseña_hash = formData.get('contraseña_hash');
        }

        setLoading(true);
        dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: true });

        fetchJson(`${API}/administradores/${id}`, {
            method: "PUT",
            body: JSON.stringify(datosActualizacion)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "administradores_upsert", payload: data });
            dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
        }).catch(err => {
            setError(err);
            dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: false });
        }).finally(() => setLoading(false));
    };

    // Navegación declarativa después de actualizar
    if (shouldRedirect) {
        return <Navigate to="/administradores" replace />;
    }

    const administrador = store.administradorDetail;

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-edit me-2"></i>
                                Actualizar Administrador
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            <form ref={formRef} onSubmit={actualizarAdministrador}>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control"
                                            placeholder="Ingrese el email del administrador"
                                            defaultValue={administrador?.email || ''}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            name="contraseña_hash"
                                            className="form-control"
                                            placeholder="Ingrese la nueva contraseña (dejar vacío para mantener)"
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Permisos Especiales *</label>
                                        <textarea
                                            name="permisos_especiales"
                                            className="form-control"
                                            placeholder="Ingrese los permisos especiales del administrador"
                                            defaultValue={administrador?.permisos_especiales || ''}
                                            rows="3"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-2 mt-4 justify-content-end">
                                    <Link
                                        to="/administradores"
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
                                        {store.api.loading ? 'Actualizando...' : 'Actualizar Administrador'}
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