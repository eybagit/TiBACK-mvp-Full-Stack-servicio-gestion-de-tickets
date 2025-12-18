import React from 'react';

const AsignacionesView = ({ tickets, changeView }) => {
    const ticketsAsignados = tickets.filter(t => t.asignacion_actual && t.asignacion_actual.analista);

    return (
        <>
            <h1 className="hyper-page-title">Asignaciones</h1>
            <div className="hyper-widget card border-0 shadow-sm">
                <div className="hyper-widget-body">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Ticket</th>
                                    <th>Analista</th>
                                    <th>Fecha Asignación</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ticketsAsignados.map((ticket) => (
                                    <tr key={ticket.id}>
                                        <td>#{ticket.id} - {ticket.titulo}</td>
                                        <td>{ticket.asignacion_actual.analista.nombre}</td>
                                        <td>{new Date(ticket.asignacion_actual.fecha_asignacion).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge bg-${ticket.estado === 'activo' ? 'warning' : ticket.estado === 'resuelto' ? 'success' : 'danger'}`}>
                                                {ticket.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => changeView(`ticket-${ticket.id}`)}
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AsignacionesView;
