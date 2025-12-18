"""
Script para extraer TicketsList de SupervisorPage.jsx
Bloque: líneas 1545-2325 (~780 líneas)
"""

# Leer archivo
with open('src/front/protectedViewsRol/supervisor/SupervisorPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.splitlines(keepends=True)

print(f"Líneas actuales: {len(lines)}")

# Buscar inicio y fin del bloque TicketsList
start_line = None
end_line = None

for i, line in enumerate(lines):
    # Buscar {/* Tickets View */} seguido de activeView === 'tickets'
    if "{/* Tickets View */}" in line:
        # Verificamos que la siguiente línea contiene activeView === 'tickets'
        if i + 2 < len(lines) and "activeView === 'tickets'" in lines[i + 2]:
            start_line = i
            print(f"Inicio TicketsList encontrado en línea {i + 1}")
            break

# Buscar el fin del bloque (línea antes de "{/* Analistas View */}")
for i, line in enumerate(lines):
    if "{/* Analistas View */}" in line:
        end_line = i  # No incluir esta línea
        print(f"Fin TicketsList encontrado en línea {i + 1}")
        break

if start_line is None or end_line is None:
    print("❌ No se encontró el bloque TicketsList")
    print(f"start_line: {start_line}, end_line: {end_line}")
    exit(1)

# Extraer el bloque JSX de TicketsList
tickets_block = lines[start_line:end_line]

# Crear el componente SupervisorTicketsList.jsx
component_header = '''import React from 'react';
import { Link } from 'react-router-dom';

/**
 * SupervisorTicketsList - Lista de tickets activos y cerrados
 * Extraído de SupervisorPage.jsx para modularización
 */
function SupervisorTicketsList({
    tickets,
    filteredTickets,
    analistas,
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
    setSelectedTicketImages,
    setSelectedImageIndex,
    changeView,
    navigate,
    cerrarTicket,
    reabrirTicket,
    escalarTicket,
    generarRecomendacion,
    agregarComentario,
    showCerrados,
    setShowCerrados,
    ticketsCerrados,
    loadingCerrados,
    cargarTicketsCerrados
}) {
    return (
'''

component_footer = '''    );
}

export default SupervisorTicketsList;
'''

# Procesar el bloque: ajustar indentación y contenido
# El bloque empieza con:
# {/* Tickets View */}
# {/* Tickets View */}  <- duplicado
# {activeView === 'tickets' && (

# Necesitamos quitar el wrapper condicional y dejar solo el contenido
# Buscamos el <> después del && (
tickets_content_start = None
tickets_content_end = None

for i, line in enumerate(tickets_block):
    if "<>" in line and tickets_content_start is None:
        tickets_content_start = i + 1  # Después del <>
        break

for i in range(len(tickets_block) - 1, -1, -1):
    line = tickets_block[i]
    if "</>" in line and ")}" in tickets_block[i + 1] if i + 1 < len(tickets_block) else False:
        tickets_content_end = i
        break
    elif "</>" in line:
        tickets_content_end = i
        break

if tickets_content_start is None or tickets_content_end is None:
    print("❌ No se encontró el contenido interno del TicketsList")
    print(f"tickets_content_start: {tickets_content_start}, tickets_content_end: {tickets_content_end}")
    # Usar todo el bloque como fallback
    tickets_jsx = tickets_block
else:
    tickets_jsx = tickets_block[tickets_content_start:tickets_content_end]

# Reducir indentación (el contenido tiene mucha indentación)
def reduce_indent(lines, spaces=8):
    result = []
    for line in lines:
        if line.startswith(' ' * spaces):
            result.append(line[spaces:])
        elif line.strip() == '':
            result.append('\n')
        else:
            result.append(line)
    return result

tickets_jsx_reduced = reduce_indent(tickets_jsx, 24)

# Escribir componente
with open('src/front/protectedViewsRol/supervisor/components/SupervisorTicketsList.jsx', 'w', encoding='utf-8') as f:
    f.write(component_header)
    f.writelines(tickets_jsx_reduced)
    f.write(component_footer)

print(f"SupervisorTicketsList.jsx creado ({len(tickets_jsx_reduced) + 50} líneas aprox)")

# Añadir import al archivo principal
import_line = "import SupervisorTicketsList from './components/SupervisorTicketsList';\n"

# Encontrar donde añadir el import (después de SupervisorHeader)
for i, line in enumerate(lines):
    if "import SupervisorHeader from" in line:
        lines.insert(i + 1, import_line)
        print(f"Import SupervisorTicketsList añadido después de línea {i + 1}")
        break

# Reemplazar el bloque completo con el componente
# Recalcular índices después de insertar import
start_line += 1
end_line += 1

new_tickets_component = '''                    {/* Tickets View */}
                    {activeView === 'tickets' && (
                        <SupervisorTicketsList
                            tickets={tickets}
                            filteredTickets={filteredTickets}
                            analistas={analistas}
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
                            loadingCerrados={loadingCerrados}
                            cargarTicketsCerrados={cargarTicketsCerrados}
                        />
                    )}

'''

# Construir nuevo contenido
new_lines = lines[:start_line] + [new_tickets_component] + lines[end_line:]

# Escribir archivo
with open('src/front/protectedViewsRol/supervisor/SupervisorPage.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Líneas después: {len(new_lines)}")
print(f"Líneas eliminadas: {len(lines) - len(new_lines)}")
print("✅ TicketsList extraído exitosamente")
