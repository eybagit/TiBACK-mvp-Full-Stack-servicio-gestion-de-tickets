import React from 'react';
import { Link } from 'react-router-dom';
import { SideBarCentral } from '../../components/SideBarCentral';
import { DashboardCalidad } from '../../pages/DashboardCalidad';
import VerTicketHDSupervisor from './verTicketHDsupervisor';
import ComentariosTicketEmbedded from '../../components/ComentariosTicketEmbedded';
import ChatSupervisorAnalistaEmbedded from '../../components/ChatSupervisorAnalistaEmbedded';
import RecomendacionVistaEmbedded from '../../components/RecomendacionVistaEmbedded';
import IdentificarImagenEmbedded from '../../components/IdentificarImagenEmbedded';
import SupervisorDashboard from './components/SupervisorDashboard';
import SupervisorHeader from './components/SupervisorHeader';
import SupervisorTicketsList from './components/SupervisorTicketsList';
import { useSupervisorPage } from './hooks/useSupervisorPage';

export function SupervisorPage() {
    // Usar el hook que contiene toda la lógica
    const {
        navigate,
        logout,
        tickets,
        ticketsCerrados,
        analistas,
        analistasCombinados,
        ticketsCerradosCombinados,
        loading,
        loadingCerrados,
        error,
        showCerrados,
        setShowCerrados,
        userData,
        infoData,
        ticketsConRecomendaciones,
        expandedTickets,
        sidebarHidden,
        activeView,
        setActiveView,
        showUserDropdown,
        setShowUserDropdown,
        isDarkMode,
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        showSearchResults,
        setShowSearchResults,
        filterEstado,
        setFilterEstado,
        filterAsignado,
        setFilterAsignado,
        filterPrioridad,
        setFilterPrioridad,
        toggleSidebar,
        changeView,
        toggleTheme,
        handleSearch,
        selectTicketFromSearch,
        closeSearchResults,
        toggleTicketExpansion,
        handleInfoChange,
        cargarTicketsCerrados,
        actualizarTodasLasTablas,
        asignarTicket,
        cerrarTicket,
        reabrirTicket,
        generarRecomendacion,
        getAvailableActions,
        getSemaforoColor,
        tieneSolicitudReapertura,
        fueEscaladoPorAnalista,
        getEstadoColor,
        getPrioridadColor,
        filteredTickets,
        stats
    } = useSupervisorPage();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center full-height">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="hyper-layout d-flex">
            {/* Sidebar central dinÃ¡mico */}
            <SideBarCentral
                sidebarHidden={sidebarHidden}
                activeView={activeView}
                changeView={changeView}
            />

            {/* Contenido principal */}
            <div className={`hyper-main-content flex-grow-1 ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
                {/* Header superior */}
                <SupervisorHeader
                    sidebarHidden={sidebarHidden}
                    toggleSidebar={toggleSidebar}
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    searchResults={searchResults}
                    showSearchResults={showSearchResults}
                    setShowSearchResults={setShowSearchResults}
                    setSearchQuery={setSearchQuery}
                    setSearchResults={setSearchResults}
                    closeSearchResults={closeSearchResults}
                    selectTicketFromSearch={selectTicketFromSearch}
                    actualizarTodasLasTablas={actualizarTodasLasTablas}
                    userData={userData}
                    showUserDropdown={showUserDropdown}
                    setShowUserDropdown={setShowUserDropdown}
                    changeView={changeView}
                    navigate={navigate}
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    logout={logout}
                />

                {/* Contenido principal */}
                <div className="p-4">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    {/* Dashboard View */}
                    {activeView === 'dashboard' && (
                        <SupervisorDashboard
                            stats={stats}
                            tickets={tickets}
                            changeView={changeView}
                            tieneSolicitudReapertura={tieneSolicitudReapertura}
                        />
                    )}

                    {/* Tickets View */}
                    {activeView === 'tickets' && (
                        <SupervisorTicketsList
                            tickets={tickets}
                            filteredTickets={filteredTickets}
                            analistas={analistas}
                            analistasCombinados={analistasCombinados}
                            filterEstado={filterEstado}
                            setFilterEstado={setFilterEstado}
                            filterAsignado={filterAsignado}
                            setFilterAsignado={setFilterAsignado}
                            filterPrioridad={filterPrioridad}
                            setFilterPrioridad={setFilterPrioridad}
                            expandedTickets={expandedTickets}
                            toggleTicketExpansion={toggleTicketExpansion}
                            getSemaforoColor={getSemaforoColor}
                            tieneSolicitudReapertura={tieneSolicitudReapertura}
                            fueEscaladoPorAnalista={fueEscaladoPorAnalista}
                            ticketsConRecomendaciones={ticketsConRecomendaciones}
                            getAvailableActions={getAvailableActions}
                            asignarTicket={asignarTicket}
                            setSelectedTicketImages={setSelectedTicketImages}
                            setSelectedImageIndex={setSelectedImageIndex}
                            setActiveView={setActiveView}
                            changeView={changeView}
                            navigate={navigate}
                            cerrarTicket={cerrarTicket}
                            reabrirTicket={reabrirTicket}
                            escalarTicket={escalarTicket}
                            generarRecomendacion={generarRecomendacion}
                            agregarComentario={agregarComentario}
                            showCerrados={showCerrados}
                            setShowCerrados={setShowCerrados}
                            ticketsCerrados={ticketsCerrados}
                            ticketsCerradosCombinados={ticketsCerradosCombinados}
                            loadingCerrados={loadingCerrados}
                            cargarTicketsCerrados={cargarTicketsCerrados}
                            getEstadoColor={getEstadoColor}
                            getPrioridadColor={getPrioridadColor}
                        />
                    )}

                    {/* Analistas View */}
                    {activeView === 'analistas' && (
                        <>
                            <h1 className="hyper-page-title">GestiÃ³n de Analistas</h1>
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
                    )}

                    {/* Asignaciones View */}
                    {activeView === 'asignaciones' && (
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
                                                    <th>Fecha AsignaciÃ³n</th>
                                                    <th>Estado</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tickets.filter(t => t.asignacion_actual && t.asignacion_actual.analista).map((ticket) => (
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
                    )}

                    {/* Escalaciones View */}
                    {activeView === 'escalaciones' && (
                        <>
                            <h1 className="hyper-page-title">Escalaciones</h1>
                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>TÃ­tulo</th>
                                                    <th>Prioridad</th>
                                                    <th>Fecha EscalaciÃ³n</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tickets.filter(t => t.estado === 'escalado').map((ticket) => (
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
                    )}

                    {/* Reportes View */}
                    {activeView === 'reportes' && (
                        <>
                            <h1 className="hyper-page-title">Reportes</h1>
                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="text-center py-4">
                                        <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">MÃ³dulo de reportes en desarrollo</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Dashboard de Calidad View */}
                    {activeView === 'dashboard-calidad' && (
                        <DashboardCalidad />
                    )}

                    {/* ConfiguraciÃ³n View */}
                    {activeView === 'configuracion' && (
                        <>
                            <h1 className="hyper-page-title">ConfiguraciÃ³n</h1>
                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="text-center py-4">
                                        <i className="fas fa-cog fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">MÃ³dulo de configuraciÃ³n en desarrollo</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Vista de Ticket Detallada */}
                    {activeView.startsWith('ticket-') && (
                        <VerTicketHDSupervisor
                            ticketId={parseInt(activeView.split('-')[1])}
                            tickets={tickets}
                            ticketsConRecomendaciones={ticketsConRecomendaciones}
                            analistas={analistas}
                            onBack={() => setActiveView('tickets')}
                            setActiveView={setActiveView}
                        />
                    )}

                    {/* Comentarios View */}
                    {activeView.startsWith('comentarios-') && (
                        <ComentariosTicketEmbedded
                            ticketId={parseInt(activeView.split('-')[1])}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {/* Chat View */}
                    {activeView.startsWith('supervisor-chat-') && (
                        <ChatSupervisorAnalistaEmbedded
                            ticketId={parseInt(activeView.split('-')[2])}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {/* Recomendación IA View */}
                    {activeView.startsWith('recomendacion-') && (
                        <RecomendacionVistaEmbedded
                            ticketId={(() => {
                                const ticketId = parseInt(activeView.split('-')[1]);
                                console.log('SupervisorPage - activeView:', activeView);
                                console.log('SupervisorPage - ticketId extraído:', ticketId);
                                return ticketId;
                            })()}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {/* Identificar Imagen View */}
                    {activeView.startsWith('identificar-') && (
                        <IdentificarImagenEmbedded
                            ticketId={parseInt(activeView.split('-')[1])}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {/* Profile View */}
                    {activeView === 'profile' && (
                        <>
                            {console.log('SupervisorPage - Rendering profile view, activeView:', activeView)}
                            <h1 className="hyper-page-title">Mi Perfil</h1>

                            <div className="hyper-widget">
                                <div className="hyper-widget-header">
                                    <h3 className="hyper-widget-title">Información Personal</h3>
                                </div>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label htmlFor="nombre" className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="nombre"
                                            name="nombre"
                                            value={infoData.nombre}
                                            onChange={handleInfoChange}
                                            placeholder="Ingresa tu nombre"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="apellido" className="form-label">Apellido *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="apellido"
                                            name="apellido"
                                            value={infoData.apellido}
                                            onChange={handleInfoChange}
                                            placeholder="Ingresa tu apellido"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="email" className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            name="email"
                                            value={infoData.email}
                                            onChange={handleInfoChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="telefono" className="form-label">Teléfono</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            id="telefono"
                                            name="telefono"
                                            value={infoData.telefono}
                                            onChange={handleInfoChange}
                                            placeholder="Ingresa tu teléfono"
                                        />
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setActiveView('dashboard')}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={updateInfo}
                                        disabled={updatingInfo}
                                    >
                                        {updatingInfo ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Actualizando...
                                            </>
                                        ) : (
                                            'Actualizar Información'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Formulario de informaciÃ³n del supervisor */}
                    {showInfoForm && (
                        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Actualizar InformaciÃ³n</h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setShowInfoForm(false)}
                                        ></button>
                                    </div>
                                    <form onSubmit={actualizarInformacion}>
                                        <div className="modal-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label">Nombre</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={infoData.nombre}
                                                            onChange={(e) => setInfoData({ ...infoData, nombre: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label">Apellido</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={infoData.apellido}
                                                            onChange={(e) => setInfoData({ ...infoData, apellido: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Email</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={infoData.email}
                                                    onChange={(e) => setInfoData({ ...infoData, email: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Ãrea Responsable</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={infoData.area_responsable}
                                                    onChange={(e) => setInfoData({ ...infoData, area_responsable: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Nueva ContraseÃ±a (opcional)</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    value={infoData.password}
                                                    onChange={(e) => setInfoData({ ...infoData, password: e.target.value })}
                                                />
                                            </div>
                                            {infoData.password && (
                                                <div className="mb-3">
                                                    <label className="form-label">Confirmar ContraseÃ±a</label>
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        value={infoData.confirmPassword}
                                                        onChange={(e) => setInfoData({ ...infoData, confirmPassword: e.target.value })}
                                                        required={infoData.password}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="modal-footer">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setShowInfoForm(false)}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={updatingInfo}
                                            >
                                                {updatingInfo ? 'Actualizando...' : 'Actualizar'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// Oka
