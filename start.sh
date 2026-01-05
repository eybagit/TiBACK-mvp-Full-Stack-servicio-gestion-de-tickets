#!/bin/bash

# Ejecutar migraciones
echo "Running database migrations..."
flask db upgrade

# Insertar datos de prueba
echo "Inserting test data..."
flask insert-test-data || echo "Test data already exists or command failed"

# Iniciar Gunicorn
echo "Starting Gunicorn..."
exec gunicorn wsgi:application --chdir ./src/ --bind 0.0.0.0:$PORT
