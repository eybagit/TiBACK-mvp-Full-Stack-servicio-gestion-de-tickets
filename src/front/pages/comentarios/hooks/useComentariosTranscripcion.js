/**
 * useComentariosTranscripcion.js
 * Hook para manejo de transcripción de voz en comentarios
 * Parte de la modularización de ComentariosTicket.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { useSpeechToText } from '../../../hooks/useSpeechToText';

/**
 * Hook para manejo de transcripción de voz
 */
export const useComentariosTranscripcion = () => {
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [textoBase, setTextoBase] = useState('');

    // Hook para transcripción de voz
    const {
        isListening,
        isPaused,
        transcript,
        interimTranscript,
        error: speechError,
        isSupported,
        startTranscription,
        togglePause,
        stopTranscription,
        clearTranscript
    } = useSpeechToText();

    // Función para manejar la transcripción
    const handleTranscription = useCallback(() => {
        if (isListening) {
            if (isPaused) {
                togglePause();
            } else {
                setTextoBase(nuevoComentario);
                stopTranscription();
            }
        } else {
            startTranscription();
        }
    }, [isListening, isPaused, nuevoComentario, togglePause, stopTranscription, startTranscription]);

    // Actualizar el campo de texto cuando hay transcripción final
    useEffect(() => {
        if (transcript) {
            setTextoBase(prev => prev + transcript + ' ');
            clearTranscript();
        }
    }, [transcript, clearTranscript]);

    // Mostrar transcripción intermedia en tiempo real
    useEffect(() => {
        if (interimTranscript && isListening) {
            const textoCompleto = textoBase + (textoBase ? ' ' : '') + interimTranscript;
            setNuevoComentario(textoCompleto);
        } else if (!isListening) {
            setNuevoComentario(textoBase);
        }
    }, [interimTranscript, isListening, textoBase]);

    // Sincronizar texto base cuando el usuario edita manualmente
    const handleTextChange = useCallback((e) => {
        const newValue = e.target.value;
        setNuevoComentario(newValue);

        if (isListening) {
            if (interimTranscript) {
                if (newValue.endsWith(interimTranscript)) {
                    const textoSinInterim = newValue.slice(0, -interimTranscript.length).trim();
                    setTextoBase(textoSinInterim);
                } else {
                    setTextoBase(newValue);
                }
            } else {
                setTextoBase(newValue);
            }
        } else {
            setTextoBase(newValue);
        }
    }, [isListening, interimTranscript]);

    // Limpiar el texto
    const limpiarComentario = useCallback(() => {
        setNuevoComentario('');
        setTextoBase('');
    }, []);

    return {
        // Estados
        nuevoComentario,
        setNuevoComentario,
        textoBase,
        setTextoBase,
        // Estados de transcripción
        isListening,
        isPaused,
        interimTranscript,
        speechError,
        isSupported,
        // Funciones
        handleTranscription,
        handleTextChange,
        limpiarComentario
    };
};

export default useComentariosTranscripcion;
