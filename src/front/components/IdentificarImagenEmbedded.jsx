import React, { useState, useEffect } from 'react';
import useGlobalReducer from '../hooks/useGlobalReducer';

// Utilidades de token seguras
const tokenUtils = {
    decodeToken: (token) => {
        try {
            if (!token) return null;
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            return JSON.parse(atob(parts[1]));
        } catch (error) {
            return null;
        }
    },
    getUserId: (token) => {
        const payload = tokenUtils.decodeToken(token);
        return payload ? payload.user_id : null;
    },
    getRole: (token) => {
        const payload = tokenUtils.decodeToken(token);
        return payload ? payload.role : null;
    }
};

const IdentificarImagenEmbedded = ({ ticketId, onBack }) => {
    const { store, dispatch } = useGlobalReducer();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [useExistingImage, setUseExistingImage] = useState(false);
    const [additionalDetails, setAdditionalDetails] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Cargar información del ticket
        const fetchTicket = async () => {
            try {
                const token = store.auth.token;

                if (!token) {
                    setError('No se encontró token de autenticación');
                    return;
                }

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al cargar el ticket');
                }

                const ticketData = await response.json();
                setTicket(ticketData);

                // Auto-detectar imagen del ticket
                if (ticketData.url_imagen) {
                    setUseExistingImage(true);
                    setImagePreview(ticketData.url_imagen);
                }
            } catch (err) {
                setError('Error al cargar el ticket');
            }
        };

        fetchTicket();

        // Cargar datos del usuario
        const cargarDatosUsuario = async () => {
            try {
                const token = store.auth.token;
                const userId = tokenUtils.getUserId(token);
                const role = tokenUtils.getRole(token);

                if (!userId || !role) return;

                let userResponse;

                if (role === 'cliente') {
                    userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } else if (role === 'analista') {
                    userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } else if (role === 'supervisor') {
                    userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } else if (role === 'administrador') {
                    userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/administradores/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                }

                if (userResponse && userResponse.ok) {
                    const userData = await userResponse.json();
                    setUserData(userData);

                    // Actualizar el store global con los datos del usuario
                    dispatch({
                        type: 'SET_USER',
                        payload: userData
                    });
                }
            } catch (err) {
                // Silently ignore
            }
        };

        if (store.auth.isAuthenticated && store.auth.token && !store.auth.user) {
            cargarDatosUsuario();
        }
    }, [store.auth.isAuthenticated, store.auth.token, store.auth.user, dispatch, ticketId]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        // Validar que tengamos imagen (subida o del ticket)
        if (!useExistingImage && !image) {
            setError('Por favor selecciona una imagen');
            return;
        }

        if (!additionalDetails.trim()) {
            setError('Por favor proporciona detalles adicionales sobre el problema');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = store.auth.token;

            const formData = new FormData();

            // Solo agregar imagen si NO estamos usando la del ticket
            if (!useExistingImage && image) {
                formData.append('image', image);
            }

            formData.append('ticket_id', ticketId);

            // Siempre incluir título y descripción del ticket
            if (ticket) {
                formData.append('ticket_title', ticket.titulo);
                formData.append('ticket_description', ticket.descripcion);
            }

            // Siempre incluir detalles adicionales
            formData.append('additional_details', additionalDetails);

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analyze-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                setAnalysisResult(result);
            } else {
                setError(result.message || 'Error al analizar la imagen');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToTicket = async () => {
        if (!analysisResult) return;

        try {
            const token = store.auth.token;

            // Construir texto del análisis completo
            let textoAnalisis = '🤖 ANÁLISIS DE IMAGEN CON IA:\n\n';

            // Problema Detectado
            textoAnalisis += '📋 PROBLEMA DETECTADO:\n';
            textoAnalisis += `${analysisResult.analysis}\n\n`;

            // Cómo Abordarlo
            if (analysisResult.recomendaciones && analysisResult.recomendaciones.length > 0) {
                textoAnalisis += '💡 CÓMO ABORDARLO:\n';
                analysisResult.recomendaciones.forEach((recomendacion, index) => {
                    textoAnalisis += `${index + 1}. ${recomendacion}\n`;
                });
                textoAnalisis += '\n';
            }

            // Preguntas para el Analista
            if (analysisResult.preguntas_para_analista && analysisResult.preguntas_para_analista.length > 0) {
                textoAnalisis += '❓ PREGUNTAS PARA EL ANALISTA:\n';
                analysisResult.preguntas_para_analista.forEach((pregunta) => {
                    textoAnalisis += `• ${pregunta}\n`;
                });
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comentarios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_ticket: parseInt(ticketId),
                    texto: textoAnalisis.trim()
                })
            });

            if (response.ok) {
                alert('Análisis guardado en el ticket');
            } else {
                setError('Error al guardar el análisis');
            }
        } catch (err) {
            setError('Error al guardar el análisis');
        }
    };

    if (!ticket) {
        return (
            <div className="hyper-layout d-flex">
                <div className="hyper-main-content flex-grow-1">
                    <div className="d-flex justify-content-center align-items-center vh-100">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            {/* Header del componente */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={onBack}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Volver
                            </button>
                            <div>
                                <h1 className="mb-0 fw-bold">
                                    <i className="fas fa-robot me-2"></i>
                                    Análisis de Imagen con IA
                                </h1>
                                <p className="text-muted mb-0">Ticket: {ticket?.titulo}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row justify-content-center">
                <div className="row">
                    <div className="col-md-8 mx-auto">
                        <div className="card">
                            <div className="card-header">
                                <h4 className="mb-0">
                                    <i className="fas fa-robot me-2"></i>
                                    Análisis de Imagen con IA
                                </h4>
                                <small className="text-muted">Ticket: {ticket.titulo}</small>
                            </div>
                            <div className="card-body">
                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                {/* Configuración de contexto */}
                                <div className="mb-4">
                                    <h5>Configuración del Análisis</h5>
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle me-2"></i>
                                        <strong>Contexto del Ticket:</strong> Se utilizará automáticamente el título y descripción del ticket como referencia para el análisis.
                                    </div>
                                </div>

                                {/* Detalles adicionales - OBLIGATORIO */}
                                <div className="mb-4">
                                    <label htmlFor="additionalDetails" className="form-label">
                                        <strong>Proporcionar detalles adicionales *</strong>
                                    </label>
                                    <textarea
                                        className="form-control"
                                        id="additionalDetails"
                                        rows="4"
                                        value={additionalDetails}
                                        onChange={(e) => setAdditionalDetails(e.target.value)}
                                        placeholder="Describe el problema que estás experimentando y qué esperas que la IA identifique en la imagen..."
                                        required
                                    />
                                    <div className="form-text">
                                        <i className="fas fa-lightbulb me-1"></i>
                                        Esta información junto con la imagen y el contexto del ticket forman el soporte para obtener buenas respuestas y solucionar el problema al cliente.
                                    </div>
                                </div>

                                {/* Carga de imagen */}
                                <div className="mb-4">
                                    {useExistingImage ? (
                                        <div>
                                            <label className="form-label">
                                                <i className="fas fa-check-circle text-success me-2"></i>
                                                Imagen del ticket cargada:
                                            </label>
                                            <div className="mt-2">
                                                <img
                                                    src={imagePreview}
                                                    alt="Imagen del ticket"
                                                    className="img-fluid img-preview-sm"
                                                />
                                            </div>
                                            <div className="form-text mt-2">
                                                <i className="fas fa-info-circle me-1"></i>
                                                Se usará la imagen cargada en el ticket.
                                                <button
                                                    className="btn btn-link btn-sm p-0 ms-2"
                                                    onClick={() => {
                                                        setUseExistingImage(false);
                                                        setImagePreview(null);
                                                    }}
                                                >
                                                    Subir otra imagen
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label htmlFor="imageUpload" className="form-label">
                                                Seleccionar imagen del problema:
                                            </label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                id="imageUpload"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                            {imagePreview && (
                                                <div className="mt-3">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="img-fluid img-preview-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Botón de análisis */}
                                <div className="mb-4">
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleAnalyze}
                                        disabled={loading || (!useExistingImage && !image) || !additionalDetails.trim()}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Analizando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-robot me-2"></i>
                                                Analizar Imagen
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Resultados del análisis */}
                                {analysisResult && (
                                    <div className="mt-4">
                                        <h5>Resultado del Análisis</h5>
                                        <div className="card">
                                            <div className="card-body">
                                                {/* Problema Detectado */}
                                                <div className="mb-4">
                                                    <h6>
                                                        <i className="fas fa-search me-2 text-primary"></i>
                                                        Problema Detectado:
                                                    </h6>
                                                    <div className="alert alert-info">
                                                        <p className="mb-0">{analysisResult.analysis}</p>
                                                    </div>
                                                </div>

                                                {/* Cómo Abordarlo */}
                                                {analysisResult.recomendaciones && analysisResult.recomendaciones.length > 0 && (
                                                    <div className="mb-4">
                                                        <h6>
                                                            <i className="fas fa-lightbulb me-2 text-warning"></i>
                                                            Cómo Abordarlo:
                                                        </h6>
                                                        <ol className="list-group list-group-numbered">
                                                            {analysisResult.recomendaciones.map((rec, index) => (
                                                                <li key={index} className="list-group-item">{rec}</li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                )}

                                                {/* Preguntas para el Analista */}
                                                {analysisResult.preguntas_para_analista && analysisResult.preguntas_para_analista.length > 0 && (
                                                    <div className="mb-4">
                                                        <h6>
                                                            <i className="fas fa-question-circle me-2 text-success"></i>
                                                            Preguntas para el Analista:
                                                        </h6>
                                                        <ul className="list-group">
                                                            {analysisResult.preguntas_para_analista.map((pregunta, index) => (
                                                                <li key={index} className="list-group-item">
                                                                    <i className="fas fa-angle-right me-2"></i>
                                                                    {pregunta}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="mt-3">
                                                    <button
                                                        className="btn btn-success"
                                                        onClick={handleSaveToTicket}
                                                    >
                                                        <i className="fas fa-save me-2"></i>
                                                        Guardar Análisis en el Ticket
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Botón de regreso */}
                                <div className="mt-4">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={onBack}
                                    >
                                        <i className="fas fa-arrow-left me-2"></i>
                                        Volver
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

export default IdentificarImagenEmbedded;
//listo