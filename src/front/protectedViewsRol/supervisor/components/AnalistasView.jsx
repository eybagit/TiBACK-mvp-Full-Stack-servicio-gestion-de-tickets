import React from 'react';
import { Link } from 'react-router-dom';

const AnalistasView = ({ analistasCombinados, tickets }) => {
    return (
        <>
            <h1 className="hyper-page-title">Gestión de Analistas</h1>
            <div className="hyper-widget card border-0 shadow-sm">
                <div className="hyper-widget-body">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Especialidad</th>
                                    <th>Tickets Asignados</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analistasCombinados.map((analista) => (
                                    <tr key={analista.id}>
                                        <td>#{analista.id}</td>
                                        <td>{analista.nombre} {analista.apellido}</td>
                                        <td>{analista.email}</td>
                                        <td>{analista.especialidad}</td>
                                        <td>
                                            <span className="badge bg-primary">
                                                {tickets.filter(t => t.asignacion_actual && t.asignacion_actual.analista && t.asignacion_actual.analista.id === analista.id).length}
                                            </span>
                                        </td>
                                        <td>
                                            <Link
                                                to={`/ver-analista/${analista.id}`}
                                                className="btn btn-sm btn-outline-primary"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </Link>
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

export default AnalistasView;
