import re

# Leer archivo
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar y reemplazar el bloque Dashboard View
pattern = r'(\{/\* Dashboard View \*/\}.*?\)\})\s*(\n\s*\{/\* Tickets View \*/\})'
replacement = '''                    {/* Dashboard View */}
                    {activeView === 'dashboard' && (
                        <ClienteDashboard 
                            tickets={tickets} 
                            changeView={changeView} 
                        />
                    )}

                    {/* Tickets View */}'''

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Agregar import
import_line = "import IdentificarImagenEmbedded from '../../components/IdentificarImagenEmbedded';"
import_with_new = import_line + "\n// Componentes modularizados\nimport ClienteDashboard from './components/ClienteDashboard';"
new_content = new_content.replace(import_line, import_with_new)

# Escribir archivo
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Lines after:', len(new_content.split('\n')))
