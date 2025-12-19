import React, { useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarCliente = () => {
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

    const cargarCliente = () => {
        setLoading(true);
        fetchJson(`${API}/clientes/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "cliente_set_detail", payload: data });
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

    const actualizarCliente = (e) => {
        e.preventDefault();

        // Usar FormData para obtener valores del formulario
        const formData = new FormData(e.target);
        const clienteActualizado = {
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            email: formData.get('email'),
            contraseña_hash: formData.get('contraseña_hash'),
            direccion: formData.get('direccion'),
            telefono: formData.get('telefono'),
            url_imagen: formData.get('url_imagen') || ''
        };

        // Validación básica
        if (!clienteActualizado.nombre || !clienteActualizado.apellido || !clienteActualizado.email) {
            setError("Los campos nombre, apellido y email son obligatorios");
            return;
        }

        setLoading(true);
        dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: true });

        fetchJson(`${API}/clientes/${id}`, {
            method: "PUT",
            body: JSON.stringify(clienteActualizado)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "clientes_upsert", payload: data });
            dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
        }).catch(err => {
            setError(err);
            dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: false });
        }).finally(() => setLoading(false));
    };

    // Navegación declarativa después de actualizar
    if (shouldRedirect) {
        return <Navigate to="/clientes" replace />;
    }

    const cliente = store.clienteDetail;

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-edit me-2"></i>
                                Actualizar Cliente
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}

                            <form ref={formRef} onSubmit={actualizarCliente}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            className="form-control"
                                            placeholder="Ingrese el nombre"
                                            defaultValue={cliente?.nombre || ''}
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
                                            defaultValue={cliente?.apellido || ''}
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
                                            defaultValue={cliente?.email || ''}
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
                                    <div className="col-md-6">
                                        <label className="form-label">Teléfono</label>
                                        <input
                                            type="tel"
                                            name="telefono"
                                            className="form-control"
                                            placeholder="Ingrese el teléfono"
                                            defaultValue={cliente?.telefono || ''}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Dirección</label>
                                        <input
                                            type="text"
                                            name="direccion"
                                            className="form-control"
                                            placeholder="Ingrese la dirección"
                                            defaultValue={cliente?.direccion || ''}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">URL Imagen de Perfil</label>
                                        <input
                                            type="text"
                                            name="url_imagen"
                                            className="form-control"
                                            placeholder="URL de imagen"
                                            defaultValue={cliente?.url_imagen || ''}
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-2 mt-4 justify-content-end">
                                    <Link
                                        to="/clientes"
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
                                        {store.api.loading ? 'Actualizando...' : 'Actualizar Cliente'}
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