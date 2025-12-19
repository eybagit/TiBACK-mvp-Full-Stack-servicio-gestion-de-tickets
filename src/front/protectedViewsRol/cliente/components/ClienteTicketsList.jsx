import React from 'react';
import TicketFilters from './TicketFilters';
import TicketRow from './TicketRow';

/**
 * ClienteTicketsList - Vista de lista de tickets del cliente
 * Muestra tabla con tickets, filtros y acciones
 */
function ClienteTicketsList({
    tickets,
    loading,
    filterEstado,
    filterAsignado,
    filterPrioridad,
    showFilterDropdown,
    setShowFilterDropdown,
    setFilterEstado,
    setFilterAsignado,
    setFilterPrioridad,
    applyFilters,
    clearFilters,
    getFilteredTickets,
    expandedTickets,
    toggleTicketExpansion,
    solicitudesReapertura,
    ticketsConRecomendaciones,
    selectedTicketId,
    changeView,
    setSelectedTicketId,
    tieneAnalistaAsignado,
    getAnalistaAsignado,
    generarRecomendacion,
    cerrarTicket,
    solicitarReapertura,
    navigate
}) {
    return (
        <>
            <h1 className="hyper-page-title">Mis Tickets</h1>

            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Mis Tickets</h5>
                    <div className="d-flex gap-2">
                        <TicketFilters
                            filterEstado={filterEstado}
                            filterAsignado={filterAsignado}
                            filterPrioridad={filterPrioridad}
                            showFilterDropdown={showFilterDropdown}
                            setShowFilterDropdown={setShowFilterDropdown}
                            setFilterEstado={setFilterEstado}
                            setFilterAsignado={setFilterAsignado}
                            setFilterPrioridad={setFilterPrioridad}
                            applyFilters={applyFilters}
                            clearFilters={clearFilters}
                        />
                    </div>
                </div>
                <div className="card-body p-0">

                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando tickets...</span>
                            </div>
                        </div>
                    ) : getFilteredTickets().length === 0 ? (
                        <div className="text-center py-4">
                            <i className="fas fa-filter fa-3x text-muted mb-3"></i>
                            <p className="text-muted">
                                {tickets.length === 0
                                    ? "No tienes tickets creados aún."
                                    : "No se encontraron tickets con los filtros aplicados."
                                }
                            </p>
                            {tickets.length === 0 ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => changeView('create')}
                                >
                                    <i className="fas fa-plus me-1"></i>
                                    Crear mi primer ticket
                                </button>
                            ) : (
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={clearFilters}
                                >
                                    <i className="fas fa-times me-1"></i>
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="text-center px-3">ID</th>
                                        <th className="text-center px-4">Título</th>
                                        <th className="text-center px-3">Estado</th>
                                        <th className="text-center px-3">Prioridad</th>
                                        <th className="text-center px-3">Asignado a</th>
                                        <th className="text-center px-3">Fecha</th>
                                        <th className="text-center px-3">Calificación</th>
                                        <th className="text-center px-4">Acciones</th>
                                        <th className="text-center px-2 th-expand">Expandir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredTickets().map((ticket) => (
                                        <TicketRow
                                            key={ticket.id}
                                            ticket={ticket}
                                            isExpanded={expandedTickets.has(ticket.id)}
                                            solicitudesReapertura={solicitudesReapertura}
                                            ticketsConRecomendaciones={ticketsConRecomendaciones}
                                            selectedTicketId={selectedTicketId}
                                            changeView={changeView}
                                            setSelectedTicketId={setSelectedTicketId}
                                            toggleTicketExpansion={toggleTicketExpansion}
                                            tieneAnalistaAsignado={tieneAnalistaAsignado}
                                            getAnalistaAsignado={getAnalistaAsignado}
                                            generarRecomendacion={generarRecomendacion}
                                            cerrarTicket={cerrarTicket}
                                            solicitarReapertura={solicitarReapertura}
                                            navigate={navigate}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default ClienteTicketsList;
