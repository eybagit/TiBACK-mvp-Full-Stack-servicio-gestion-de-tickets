import React from 'react';

const EscalacionesView = ({ tickets, changeView }) => {
    const ticketsEscalados = tickets.filter(t => t.estado === 'escalado');

    return (
        <>
            <h1 className="hyper-page-title">Escalaciones</h1>
            <div className="hyper-widget card border-0 shadow-sm">
                <div className="hyper-widget-body">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Título</th>
                                    <th>Prioridad</th>
                                    <th>Fecha Escalación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ticketsEscalados.map((ticket) => (
                                    <tr key={ticket.id}>
                                        <td>#{ticket.id}</td>
                                        <td>{ticket.titulo}</td>
                                        <td>
                                            <span className={`badge bg-${ticket.prioridad === 'baja' ? 'secondary' : ticket.prioridad === 'media' ? 'primary' : ticket.prioridad === 'alta' ? 'warning' : 'danger'}`}>
                                                {ticket.prioridad}
                                            </span>
                                        </td>
                                        <td>{new Date(ticket.fecha_creacion).toLocaleDateString()}</td>
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

export default EscalacionesView;
