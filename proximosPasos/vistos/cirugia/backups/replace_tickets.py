import re

# Leer archivo
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Agregar import de ClienteTicketsList
import_line = "import ClienteDashboard from './components/ClienteDashboard';"
import_with_new = import_line + "\nimport ClienteTicketsList from './components/ClienteTicketsList';"
content = content.replace(import_line, import_with_new)

# Reemplazar bloque Tickets View
start_marker = "{/* Tickets View */}"
end_marker = "{/* Create Ticket View */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("ERROR: No se encontraron los marcadores")
    exit(1)

# Crear el reemplazo
replacement = '''                    {/* Tickets View */}
                    {activeView === 'tickets' && (
                        <ClienteTicketsList 
                            tickets={tickets}
                            loading={loading}
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
                            getFilteredTickets={getFilteredTickets}
                            expandedTickets={expandedTickets}
                            toggleTicketExpansion={toggleTicketExpansion}
                            solicitudesReapertura={solicitudesReapertura}
                            ticketsConRecomendaciones={ticketsConRecomendaciones}
                            changeView={changeView}
                            setSelectedTicketId={setSelectedTicketId}
                            tieneAnalistaAsignado={tieneAnalistaAsignado}
                            getAnalistaAsignado={getAnalistaAsignado}
                            generarRecomendacion={generarRecomendacion}
                            cerrarTicket={cerrarTicket}
                            solicitarReapertura={solicitarReapertura}
                            navigate={navigate}
                        />
                    )}

                    '''

# Reemplazar
new_content = content[:start_idx] + replacement + content[end_idx:]

# Escribir archivo
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Lines after:', len(new_content.split('\n')))
