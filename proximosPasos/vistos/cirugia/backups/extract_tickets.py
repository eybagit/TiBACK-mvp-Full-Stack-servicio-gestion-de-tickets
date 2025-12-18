import re

# Leer el archivo ClientePage.jsx actual
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar el bloque Tickets View completo
start_marker = "{/* Tickets View */}"
end_marker = "{/* Create Ticket View */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("ERROR: No se encontraron los marcadores")
    exit(1)

# Extraer el contenido del Tickets View (sin los marcadores)
tickets_block = content[start_idx:end_idx].strip()

# Obtener el contenido JSX interno (removiendo la condición y los fragmentos)
# El bloque empieza con {/* Tickets View */} y {activeView === 'tickets' && ( <> ... </> )}
lines = tickets_block.split('\n')

# Guardar el bloque extraído para crear el componente
tickets_jsx_content = '\n'.join(lines)

print(f"Tickets View extraído:")
print(f"  - Inicio: {start_idx}")
print(f"  - Fin: {end_idx}")
print(f"  - Líneas: {len(lines)}")

# Guardar el bloque para referencia
with open('proximosPasos/cirugia/tickets_view_block.txt', 'w', encoding='utf-8') as f:
    f.write(tickets_jsx_content)

print("\nBloque guardado en proximosPasos/cirugia/tickets_view_block.txt")
