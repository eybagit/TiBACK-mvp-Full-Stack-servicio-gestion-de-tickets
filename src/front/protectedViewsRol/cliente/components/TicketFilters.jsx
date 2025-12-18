import React from 'react';

/**
 * TicketFilters - Dropdown de filtros para la lista de tickets
 */
function TicketFilters({
    filterEstado,
    filterAsignado,
    filterPrioridad,
    showFilterDropdown,
    setShowFilterDropdown,
    setFilterEstado,
    setFilterAsignado,
    setFilterPrioridad,
    applyFilters,
    clearFilters
}) {
    return (
        <div className="dropdown filter-dropdown">
            <button
                className="btn btn-outline-primary btn-sm dropdown-toggle"
                type="button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
                <i className="fas fa-filter me-1"></i>
                Filtrar
                {(filterEstado || filterAsignado || filterPrioridad) && (
                    <span className="badge bg-primary ms-1">{(filterEstado ? 1 : 0) + (filterAsignado ? 1 : 0) + (filterPrioridad ? 1 : 0)}</span>
                )}
            </button>

            {showFilterDropdown && (
                <div className="dropdown-menu show position-absolute dropdown-menu-positioned">
                    <div className="dropdown-header">
                        <h6 className="mb-0">Filtrar Tickets</h6>
                    </div>

                    <div className="px-3 py-2">
                        <label className="form-label small">Por Estado:</label>
                        <select
                            className="form-select form-select-sm"
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="creado">Creado</option>
                            <option value="en_espera">En Espera</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="solucionado">Solucionado</option>
                            <option value="cerrado">Cerrado</option>
                        </select>
                    </div>

                    <div className="px-3 py-2">
                        <label className="form-label small">Por Asignación:</label>
                        <select
                            className="form-select form-select-sm"
                            value={filterAsignado}
                            onChange={(e) => setFilterAsignado(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="asignados">Con Analista Asignado</option>
                            <option value="sin_asignar">Sin Asignar</option>
                        </select>
                    </div>

                    <div className="px-3 py-2">
                        <label className="form-label small">Por Prioridad:</label>
                        <select
                            className="form-select form-select-sm"
                            value={filterPrioridad}
                            onChange={(e) => setFilterPrioridad(e.target.value)}
                        >
                            <option value="">Todas las prioridades</option>
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="normal">Normal</option>
                            <option value="baja">Baja</option>
                        </select>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="d-flex gap-2 px-3 py-2">
                        <button
                            className="btn btn-primary btn-sm flex-fill"
                            onClick={applyFilters}
                        >
                            <i className="fas fa-check me-1"></i>
                            Aplicar
                        </button>
                        <button
                            className="btn btn-outline-secondary btn-sm flex-fill"
                            onClick={clearFilters}
                        >
                            <i className="fas fa-times me-1"></i>
                            Limpiar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TicketFilters;
