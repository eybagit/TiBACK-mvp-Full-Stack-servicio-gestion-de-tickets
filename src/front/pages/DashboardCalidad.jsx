/**
 * DashboardCalidad.jsx
 * Dashboard de calidad de analistas - MODULARIZADO
 * 
 * Reducido de 627 líneas a ~120 líneas (-81%)
 * 
 * Estructura modular:
 * - hooks/useDashboardCalidad.js - Manejo de datos y métricas
 * - components/CalidadMetrics.jsx - Métricas principales
 * - components/CalidadCharts.jsx - Gráficos y visualizaciones
 * - components/CalidadTop3.jsx - Top 3 analistas
 * - components/CalidadAnalistaDetail.jsx - Detalles del analista
 */

import React from 'react';
import useGlobalReducer from '../hooks/useGlobalReducer';

// Hook modularizado
import { useDashboardCalidad } from './dashboardCalidad/hooks/useDashboardCalidad';

// Componentes modularizados
import CalidadMetrics from './dashboardCalidad/components/CalidadMetrics';
import CalidadCharts from './dashboardCalidad/components/CalidadCharts';
import CalidadTop3 from './dashboardCalidad/components/CalidadTop3';
import CalidadAnalistaDetail from './dashboardCalidad/components/CalidadAnalistaDetail';

export function DashboardCalidad() {
    const { store } = useGlobalReducer();

    const {
        analistas,
        loading,
        error,
        selectedAnalista,
        setSelectedAnalista,
        getMetrica,
        getMetricaPromedio
    } = useDashboardCalidad(store);

    // Loading state
    if (loading) {
        return (
            <div className="container py-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando dashboard...</span>
                    </div>
                    <p className="mt-3 text-muted">Cargando métricas de rendimiento...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container py-4">
                <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar el dashboard: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4 px-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="hyper-page-title">
                            <i className="fas fa-chart-line me-2"></i>
                            Dashboard de Calidad
                        </h1>
                        <div className="d-flex gap-3">
                            <div className="d-flex align-items-center gap-2">
                                <label className="form-label mb-0 fw-semibold">Analista:</label>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ minWidth: '200px' }}
                                    value={selectedAnalista || ''}
                                    onChange={(e) => setSelectedAnalista(e.target.value ? parseInt(e.target.value) : null)}
                                >
                                    <option value="">Todos los analistas</option>
                                    {analistas.map((analista) => (
                                        <option key={analista.id} value={analista.id}>
                                            {analista.nombre} {analista.apellido}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => window.location.reload()}
                            >
                                <i className="fas fa-sync-alt me-1"></i>
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Métricas principales */}
            <CalidadMetrics
                analistas={analistas}
                selectedAnalista={selectedAnalista}
                getMetrica={getMetrica}
                getMetricaPromedio={getMetricaPromedio}
            />

            {/* Gráficos */}
            <CalidadCharts
                selectedAnalista={selectedAnalista}
                analistas={analistas}
                getMetrica={getMetrica}
                getMetricaPromedio={getMetricaPromedio}
            />

            {/* Top 3 (solo cuando no hay analista seleccionado) */}
            {!selectedAnalista && <CalidadTop3 analistas={analistas} />}

            {/* Detalles del analista (solo cuando hay uno seleccionado) */}
            {selectedAnalista && (
                <CalidadAnalistaDetail
                    analistas={analistas}
                    selectedAnalista={selectedAnalista}
                />
            )}
        </div>
    );
}
