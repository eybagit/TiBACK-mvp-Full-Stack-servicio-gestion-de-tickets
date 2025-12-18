"""
Script para extraer el Dashboard de SupervisorPage.jsx
Reemplaza las líneas 1720-1946 con el componente SupervisorDashboard
"""

# Leer archivo
with open('src/front/protectedViewsRol/supervisor/SupervisorPage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Líneas originales: {len(lines)}")

# Añadir import después de línea 10 (IdentificarImagenEmbedded)
# Buscar la línea del import
for i, line in enumerate(lines):
    if "import IdentificarImagenEmbedded from" in line:
        # Insertar después de esta línea
        lines.insert(i + 1, "import SupervisorDashboard from './components/SupervisorDashboard';\n")
        print(f"Import añadido después de línea {i + 1}")
        break

# Ahora las líneas se desplazaron +1
# El bloque Dashboard está en líneas 1721-1947 (0-indexed: 1720-1946)
# Con el import añadido: 1722-1948 (0-indexed: 1721-1947)

# Buscar inicio y fin del bloque Dashboard
start_line = None
end_line = None

for i, line in enumerate(lines):
    if "{/* Dashboard View */}" in line and "activeView === 'dashboard'" in lines[i + 1]:
        start_line = i
        print(f"Inicio Dashboard encontrado en línea {i + 1}")
        break

# Buscar el fin del bloque Dashboard (buscar "{/* Tickets View */}")
for i, line in enumerate(lines):
    if i > start_line and "{/* Tickets View */}" in line:
        end_line = i
        print(f"Fin Dashboard encontrado en línea {i + 1}")
        break

if start_line is not None and end_line is not None:
    # Reemplazo del bloque
    new_dashboard = '''                    {/* Dashboard View */}
                    {activeView === 'dashboard' && (
                        <SupervisorDashboard
                            stats={stats}
                            tickets={tickets}
                            changeView={changeView}
                            tieneSolicitudReapertura={tieneSolicitudReapertura}
                        />
                    )}

'''
    
    # Construir nuevo contenido
    new_lines = lines[:start_line] + [new_dashboard] + lines[end_line:]
    
    # Escribir archivo
    with open('src/front/protectedViewsRol/supervisor/SupervisorPage.jsx', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"Líneas después: {len(new_lines)}")
    print(f"Líneas eliminadas: {len(lines) - len(new_lines)}")
    print("✅ Dashboard extraído exitosamente")
else:
    print("❌ No se encontró el bloque Dashboard")
