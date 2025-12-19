import React, { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ImageUpload from "../components/ImageUpload";

const AgregarTicket = () => {
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

    const manejarEnvio = async (e) => {
        e.preventDefault();
        setLoading(true);
        dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: true });

        try {
            // Usar FormData para obtener valores del formulario
            const formData = new FormData(e.target);
            const nuevoTicket = {
                id_cliente: formData.get('id_cliente'),
                estado: formData.get('estado'),
                titulo: formData.get('titulo'),
                descripcion: formData.get('descripcion'),
                fecha_creacion: formData.get('fecha_creacion'),
                prioridad: formData.get('prioridad'),
                url_imagen: formData.get('url_imagen') || '',
                img_urls: []
            };

            const res = await fetchJson(`${API}/tickets`, {
                method: "POST",
                body: JSON.stringify(nuevoTicket)
            });

            if (!res.ok) throw new Error(res.data.message);
            const ticketCreado = res.data;
            dispatch({ type: "tickets_add", payload: ticketCreado });
            dispatch({ type: 'CRUD_SET_FORM_SUCCESS', payload: true });
        } catch (err) {
            setError(err);
            dispatch({ type: 'CRUD_SET_FORM_SUBMITTING', payload: false });
        } finally {
            setLoading(false);
        }
    };

    // Navegación declarativa después de crear
    if (shouldRedirect) {
        return <Navigate to="/tickets" replace />;
    }

    return (
        <div className="container py-4">
            <h2 className="mb-3">Agregar Nuevo Ticket</h2>

            {store?.api?.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            <form onSubmit={manejarEnvio}>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">ID Cliente</label>
                        <input
                            type="number"
                            name="id_cliente"
                            className="form-control"
                            placeholder="Ingrese ID del cliente"
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Estado</label>
                        <select
                            name="estado"
                            className="form-control"
                            defaultValue="creado"
                        >
                            <option value="creado">Creado</option>
                            <option value="recibido">Recibido</option>
                            <option value="en_espera">En Espera</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="solucionado">Solucionado</option>
                            <option value="cerrado">Cerrado</option>
                            <option value="reabierto">Reabierto</option>
                        </select>
                    </div>
                    <div className="col-12">
                        <label className="form-label">Título</label>
                        <input
                            type="text"
                            name="titulo"
                            className="form-control"
                            placeholder="Ingrese título del ticket"
                            required
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">Descripción</label>
                        <textarea
                            name="descripcion"
                            className="form-control"
                            rows="3"
                            placeholder="Ingrese descripción del ticket"
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Fecha Creación</label>
                        <input
                            type="date"
                            name="fecha_creacion"
                            className="form-control"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Prioridad</label>
                        <select
                            name="prioridad"
                            className="form-control"
                            defaultValue="media"
                        >
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                        </select>
                    </div>
                    <div className="col-12">
                        <label className="form-label">URL Imagen (opcional)</label>
                        <input
                            type="text"
                            name="url_imagen"
                            className="form-control"
                            placeholder="URL de imagen"
                        />
                    </div>

                    <div className="mt-4">
                        <button
                            type="submit"
                            className="btn btn-primary me-2"
                            disabled={store.crud?.formSubmitting}
                        >
                            <i className="fas fa-save"></i> Guardar
                        </button>
                        <Link to="/tickets" className="btn btn-secondary">
                            Cancelar
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AgregarTicket;