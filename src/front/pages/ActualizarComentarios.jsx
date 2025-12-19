import React, { useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarComentarios = () => {
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

    const cargarComentario = () => {
        setLoading(true);
        fetchJson(`${API}/comentarios/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "comentario_set_detail", payload: data });
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

    const actualizarComentario = (e) => {
        e.preventDefault();

        // Usar FormData para obtener valores del formulario
        const formData = new FormData(e.target);

        if (!formData.get('id_gestion') || !formData.get('id_cliente') || !formData.get('id_analista') || !formData.get('id_supervisor') || !formData.get('texto')) {
            setError("Los campos ID Gestión, ID Cliente, ID Analista, ID Supervisor y Texto son obligatorios");
            return;
        }

        // Convertir strings a números para los IDs
        const comentarioData = {
            id_gestion: parseInt(formData.get('id_gestion')),
            id_cliente: parseInt(formData.get('id_cliente')),
            id_analista: parseInt(formData.get('id_analista')),
            id_supervisor: parseInt(formData.get('id_supervisor')),
            texto: formData.get('texto'),
            fecha_comentario: formData.get('fecha_comentario')
        };

        setLoading(true);
        dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: true });

        fetchJson(`${API}/comentarios/${id}`, {
            method: "PUT",
            body: JSON.stringify(comentarioData)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "comentarios_upsert", payload: data });
            dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
        }).catch(err => {
            setError(err);
            dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: false });
        }).finally(() => setLoading(false));
    };

    // Navegación declarativa después de actualizar
    if (shouldRedirect) {
        return <Navigate to="/comentarios" replace />;
    }

    const comentario = store.comentarioDetail;

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-comment-edit me-2"></i>
                                Actualizar Comentario
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            <form ref={formRef} onSubmit={actualizarComentario}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">ID Gestión *</label>
                                        <input
                                            type="number"
                                            name="id_gestion"
                                            className="form-control"
                                            placeholder="Ingrese el ID de gestión"
                                            defaultValue={comentario?.id_gestion || ''}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Cliente *</label>
                                        <input
                                            type="number"
                                            name="id_cliente"
                                            className="form-control"
                                            placeholder="Ingrese el ID del cliente"
                                            defaultValue={comentario?.id_cliente || ''}
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
                                            defaultValue={comentario?.id_analista || ''}
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
                                            defaultValue={comentario?.id_supervisor || ''}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Texto del Comentario *</label>
                                        <textarea
                                            name="texto"
                                            className="form-control"
                                            placeholder="Ingrese el texto del comentario"
                                            defaultValue={comentario?.texto || ''}
                                            rows="4"
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Fecha del Comentario</label>
                                        <input
                                            type="date"
                                            name="fecha_comentario"
                                            className="form-control"
                                            defaultValue={comentario?.fecha_comentario || ''}
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-2 mt-4 justify-content-end">
                                    <Link
                                        to="/comentarios"
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
                                        {store.api.loading ? 'Actualizando...' : 'Actualizar Comentario'}
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