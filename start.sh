#!/bin/bash

# Ejecutar migraciones
echo "Running database migrations..."
flask db upgrade

# Iniciar Gunicorn
echo "Starting Gunicorn..."
exec gunicorn wsgi:application --chdir ./src/ --bind 0.0.0.0:$PORT
