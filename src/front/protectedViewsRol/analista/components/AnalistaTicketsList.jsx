import React from 'react';
import TicketRow from './TicketRow';

/**
 * AnalistaTicketsList - Componente de presentación para la lista de tickets
 */
function AnalistaTicketsList({
    tickets,
    expandedTickets,
    ticketsSolicitudReapertura,
    toggleTicketExpansion,
    openVerHD,
    openComments,
    openChat,
    openSupervisorChat,
    setModalTicketId,
    setActiveView,
    iniciarTrabajo,
    marcarComoResuelto,
    escalarTicket
}) {
    return (
        <>
            <h1 className="hyper-page-title">Mis Tickets</h1>

            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Mis Tickets</h5>
                </div>
                <div className="card-body p-0">
                    {tickets.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="mb-3">
                                <i className="fas fa-ticket-alt fa-3x text-muted"></i>
                            </div>
                            <h5 className="text-muted">No tienes tickets asignados</h5>
                            <p className="text-muted">
                                Los tickets aparecerán aquí cuando te sean asignados por un supervisor.
                            </p>
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
                                        <th className="text-center px-3">Cliente</th>
                                        <th className="text-center px-3">Fecha</th>
                                        <th className="text-center px-4">Acciones</th>
                                        <th className="text-center px-2 th-expand">Expandir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(tickets) && tickets.map((ticket) => (
                                        <TicketRow
                                            key={ticket.id}
                                            ticket={ticket}
                                            isExpanded={expandedTickets.has(ticket.id)}
                                            tieneSolicitudReapertura={ticketsSolicitudReapertura.has(ticket.id)}
                                            toggleTicketExpansion={toggleTicketExpansion}
                                            openVerHD={openVerHD}
                                            openComments={openComments}
                                            openChat={openChat}
                                            openSupervisorChat={openSupervisorChat}
                                            setModalTicketId={setModalTicketId}
                                            setActiveView={setActiveView}
                                            iniciarTrabajo={iniciarTrabajo}
                                            marcarComoResuelto={marcarComoResuelto}
                                            escalarTicket={escalarTicket}
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

export default AnalistaTicketsList;
