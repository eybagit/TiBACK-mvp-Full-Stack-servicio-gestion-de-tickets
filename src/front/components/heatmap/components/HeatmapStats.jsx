/**
 * HeatmapStats.jsx
 * Estadísticas del mapa de calor - DISEÑO PREMIUM
 * Glassmorphism, gradientes, iconos y colores por estado
 */

import React from 'react';

const HeatmapStats = ({ stats }) => {
    const statCards = [
        {
            value: stats.total,
            label: 'Total Tickets',
            icon: 'fas fa-ticket-alt',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            iconBg: 'rgba(102, 126, 234, 0.2)'
        },
        {
            value: stats.pendientes || 0,
            label: 'Pendientes',
            icon: 'fas fa-clock',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            iconBg: 'rgba(245, 87, 108, 0.2)'
        },
        {
            value: stats.enProceso,
            label: 'En Proceso',
            icon: 'fas fa-cog fa-spin',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            iconBg: 'rgba(79, 172, 254, 0.2)'
        },
        {
            value: stats.solucionados,
            label: 'Solucionados',
            icon: 'fas fa-check-circle',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            iconBg: 'rgba(67, 233, 123, 0.2)'
        },
        {
            value: stats.cerrados,
            label: 'Cerrados',
            icon: 'fas fa-lock',
            gradient: 'linear-gradient(135deg, #596164 0%, #868f96 100%)',
            iconBg: 'rgba(134, 143, 150, 0.2)'
        },
        {
            value: stats.altaPrioridad || 0,
            label: 'Alta Prioridad',
            icon: 'fas fa-exclamation-triangle',
            gradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
            iconBg: 'rgba(255, 8, 68, 0.2)'
        }
    ];

    return (
        <div className="row mt-4 g-3">
            {statCards.map((card, index) => (
                <div key={index} className="col-lg-2 col-md-4 col-6">
                    <div
                        className="card border-0 h-100 position-relative overflow-hidden"
                        style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}
                    >
                        {/* Gradient accent bar */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: card.gradient,
                                borderRadius: '16px 16px 0 0'
                            }}
                        />

                        <div className="card-body text-center py-3 px-2">
                            {/* Icon container */}
                            <div
                                className="d-inline-flex align-items-center justify-content-center mb-2"
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: card.iconBg
                                }}
                            >
                                <i
                                    className={card.icon}
                                    style={{
                                        fontSize: '1.25rem',
                                        background: card.gradient,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}
                                />
                            </div>

                            {/* Value */}
                            <h4
                                className="mb-1 fw-bold"
                                style={{
                                    background: card.gradient,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontSize: '1.75rem'
                                }}
                            >
                                {card.value}
                            </h4>

                            {/* Label */}
                            <small className="text-muted fw-medium" style={{ fontSize: '0.75rem' }}>
                                {card.label}
                            </small>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HeatmapStats;
