import React from 'react';
import TicketRow from './TicketRow';
import ClosedTicketsTable from './ClosedTicketsTable';

/**
 * SupervisorTicketsList - Lista de tickets activos y cerrados
 * Refactorizado: usa TicketRow y ClosedTicketsTable
 */
function SupervisorTicketsList({
    tickets,
    filteredTickets,
    analistas,
    analistasCombinados,
    filterEstado,
    setFilterEstado,
    filterAsignado,
    setFilterAsignado,
    filterPrioridad,
    setFilterPrioridad,
    expandedTickets,
    toggleTicketExpansion,
    getSemaforoColor,
    tieneSolicitudReapertura,
    fueEscaladoPorAnalista,
    ticketsConRecomendaciones,
    getAvailableActions,
    asignarTicket,
    setActiveView,
    changeView,
    navigate,
    cerrarTicket,
    reabrirTicket,
    generarRecomendacion,
    showCerrados,
    setShowCerrados,
    ticketsCerradosCombinados,
    loadingCerrados,
    cargarTicketsCerrados,
    getEstadoColor,
    getPrioridadColor
}) {
    return (
        <>
            <h1 className="hyper-page-title">Todos los Tickets</h1>

            {/* Lista de tickets activos */}
            <div className="hyper-widget card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Gestión de Tickets</h5>
                    <div className="d-flex gap-2 align-items-center">
                        <small className="text-muted">
                            {analistas.length} analista{analistas.length !== 1 ? 's' : ''} disponible{analistas.length !== 1 ? 's' : ''}
                        </small>

                        {/* Dropdown de filtros */}
                        <div className="dropdown">
                            <button
                                className="btn btn-outline-primary btn-sm dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="fas fa-filter me-1"></i>
                                Filtrar
                                {(filterEstado || filterAsignado || filterPrioridad) && (
                                    <span className="badge bg-primary ms-1">
                                        {(filterEstado ? 1 : 0) + (filterAsignado ? 1 : 0) + (filterPrioridad ? 1 : 0)}
                                    </span>
                                )}
                            </button>

                            <ul className="dropdown-menu">
                                <li><h6 className="dropdown-header">Filtrar Tickets</h6></li>
                                <li>
                                    <div className="px-3 py-2">
                                        <label className="form-label small">Por Estado:</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={filterEstado}
                                            onChange={(e) => setFilterEstado(e.target.value)}
                                        >
                                            <option value="">Todos los estados</option>
                                            <option value="activo">Activo</option>
                                            <option value="en_progreso">En Progreso</option>
                                            <option value="resuelto">Resuelto</option>
                                            <option value="escalado">Escalado</option>
                                            <option value="cerrado">Cerrado</option>
                                        </select>
                                    </div>
                                </li>
                                <li>
                                    <div className="px-3 py-2">
                                        <label className="form-label small">Por Asignación:</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={filterAsignado}
                                            onChange={(e) => setFilterAsignado(e.target.value)}
                                        >
                                            <option value="">Todos</option>
                                            <option value="asignados">Con Analista Asignado</option>
                                            <option value="no-asignados">Sin Asignar</option>
                                        </select>
                                    </div>
                                </li>
                                <li>
                                    <div className="px-3 py-2">
                                        <label className="form-label small">Por Prioridad:</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={filterPrioridad}
                                            onChange={(e) => setFilterPrioridad(e.target.value)}
                                        >
                                            <option value="">Todas las prioridades</option>
                                            <option value="baja">Baja</option>
                                            <option value="media">Media</option>
                                            <option value="alta">Alta</option>
                                            <option value="critica">Crítica</option>
                                        </select>
                                    </div>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setFilterEstado('');
                                            setFilterAsignado('');
                                            setFilterPrioridad('');
                                        }}
                                    >
                                        <i className="fas fa-times me-1"></i>
                                        Limpiar filtros
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="card-body p-0">
                    {filteredTickets.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fas fa-ticket-alt fa-3x text-muted mb-3"></i>
                            <p className="text-muted">No hay tickets que coincidan con los filtros</p>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    setFilterEstado('');
                                    setFilterAsignado('');
                                    setFilterPrioridad('');
                                }}
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Ticket</th>
                                        <th>Estado</th>
                                        <th>Prioridad</th>
                                        <th>Analista</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.map((ticket) => (
                                        <TicketRow
                                            key={ticket.id}
                                            ticket={ticket}
                                            expandedTickets={expandedTickets}
                                            toggleTicketExpansion={toggleTicketExpansion}
                                            getSemaforoColor={getSemaforoColor}
                                            tieneSolicitudReapertura={tieneSolicitudReapertura}
                                            fueEscaladoPorAnalista={fueEscaladoPorAnalista}
                                            ticketsConRecomendaciones={ticketsConRecomendaciones}
                                            getAvailableActions={getAvailableActions}
                                            asignarTicket={asignarTicket}
                                            analistasCombinados={analistasCombinados}
                                            setActiveView={setActiveView}
                                            changeView={changeView}
                                            cerrarTicket={cerrarTicket}
                                            reabrirTicket={reabrirTicket}
                                            generarRecomendacion={generarRecomendacion}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabla de tickets cerrados */}
            <ClosedTicketsTable
                showCerrados={showCerrados}
                setShowCerrados={setShowCerrados}
                ticketsCerradosCombinados={ticketsCerradosCombinados}
                loadingCerrados={loadingCerrados}
                cargarTicketsCerrados={cargarTicketsCerrados}
                getEstadoColor={getEstadoColor}
                getPrioridadColor={getPrioridadColor}
                setActiveView={setActiveView}
            />
        </>
    );
}

export default SupervisorTicketsList;
