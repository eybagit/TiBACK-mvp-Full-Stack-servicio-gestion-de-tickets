import React, { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const AgregarSupervisor = () => {
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

    const manejarEnvio = (e) => {
        e.preventDefault();

        // Usar FormData para obtener valores del formulario
        const formData = new FormData(e.target);
        const nuevoSupervisor = {
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            email: formData.get('email'),
            contraseña_hash: formData.get('contraseña_hash'),
            area_responsable: formData.get('area_responsable')
        };

        setLoading(true);
        dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: true });

        fetchJson(`${API}/supervisores`, {
            method: "POST",
            body: JSON.stringify(nuevoSupervisor)
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "supervisores_add", payload: data });
                dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
            })
            .catch(err => {
                setError(err);
                dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: false });
            })
            .finally(() => setLoading(false));
    };

    // Navegación declarativa después de crear
    if (shouldRedirect) {
        return <Navigate to="/supervisores" replace />;
    }

    return (
        <div className="container py-4">
            <h2 className="mb-3">Agregar Nuevo Supervisor</h2>

            {store?.api?.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            <form onSubmit={manejarEnvio}>
                <div className="row g-3">
                    <div className="col-6">
                        <label className="form-label">Nombre</label>
                        <input
                            type="text"
                            name="nombre"
                            className="form-control"
                            placeholder="Ingrese nombre"
                            required
                        />
                    </div>
                    <div className="col-6">
                        <label className="form-label">Apellido</label>
                        <input
                            type="text"
                            name="apellido"
                            className="form-control"
                            placeholder="Ingrese apellido"
                            required
                        />
                    </div>
                    <div className="col-6">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="Ingrese email"
                            required
                        />
                    </div>
                    <div className="col-6">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            name="contraseña_hash"
                            className="form-control"
                            placeholder="Ingrese contraseña_hash"
                            required
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">Área Responsable</label>
                        <input
                            type="text"
                            name="area_responsable"
                            className="form-control"
                            placeholder="Ingrese area_responsable"
                            required
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <button
                        type="submit"
                        className="btn btn-primary me-2"
                        disabled={store.api.loading || store.crud?.formSubmitting}
                    >
                        <i className="fas fa-save"></i> Guardar
                    </button>
                    <Link to="/supervisores" className="btn btn-secondary">
                        Cancelar
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default AgregarSupervisor;