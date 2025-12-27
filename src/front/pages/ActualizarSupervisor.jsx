import React, { useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const ActualizarSupervisor = () => {
    const { supervisorid } = useParams();
    const { store, dispatch } = useGlobalReducer();
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

    const cargarSupervisor = () => {
        setLoading(true);
        fetchJson(`${API}/supervisores/${supervisorid}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "supervisor_set_detail", payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (supervisorid) {
            cargarSupervisor();
        }
        // Limpiar estado al desmontar
        return () => {
            dispatch({ type: 'CRUD_RESET_FORM' });
        };
    }, [supervisorid]);

    const actualizarSupervisor = (e) => {
        e.preventDefault();

        // Usar FormData para obtener valores del formulario
        const formData = new FormData(e.target);
        const supervisorActualizado = {
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            email: formData.get('email'),
            contraseña_hash: formData.get('contraseña_hash'),
            area_responsable: formData.get('area_responsable')
        };

        setLoading(true);
        dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: true });

        fetchJson(`${API}/supervisores/${supervisorid}`, {
            method: "PUT",
            body: JSON.stringify(supervisorActualizado)
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "supervisores_upsert", payload: data });
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
        return <Navigate to={`/supervisor/${supervisorid}`} replace />;
    }

    const supervisor = store.supervisorDetail;

    return (
        <div className="container py-4">
            <h2 className="mb-3">Editar Supervisor</h2>

            {store.api.error && <div className="alert alert-danger">{store.api.error}</div>}

            <div className="card">
                <div className="card-body">
                    <form ref={formRef} onSubmit={actualizarSupervisor}>
                        <div className="mb-3">
                            <label className="form-label">Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                className="form-control"
                                defaultValue={supervisor?.nombre || ''}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Apellido</label>
                            <input
                                type="text"
                                name="apellido"
                                className="form-control"
                                defaultValue={supervisor?.apellido || ''}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-control"
                                defaultValue={supervisor?.email || ''}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Contraseña</label>
                            <input
                                type="password"
                                name="contraseña_hash"
                                className="form-control"
                                placeholder="Dejar vacío para mantener"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Área Responsable</label>
                            <input
                                type="text"
                                name="area_responsable"
                                className="form-control"
                                defaultValue={supervisor?.area_responsable || ''}
                                required
                            />
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <Link to={`/supervisor/${supervisorid}`} className="btn btn-secondary">
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={store.api.loading || store.crud?.formSubmitting}
                            >
                                <i className="fas fa-save"></i> Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ActualizarSupervisor;