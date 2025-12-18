import { useState, useEffect } from 'react';

/**
 * useScreenCapture - Hook para captura de pantalla y escritorio
 */
export function useScreenCapture({ uploadImage }) {
    const [capturing, setCapturing] = useState(false);
    const [showDesktopCapture, setShowDesktopCapture] = useState(false);

    // Escuchar mensaje de la ventana flotante
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'capture-now') {
                // La captura ya se está ejecutando automáticamente
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const captureFromStream = async (stream) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        stream.getTracks().forEach(track => track.stop());

        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png', 0.8);
        });

        return blob;
    };

    const handleScreenCapture = async (setError) => {
        try {
            setCapturing(true);
            setError(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('La captura de pantalla no está disponible en este navegador');
            }

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'screen',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            const blob = await captureFromStream(stream);
            const file = new File([blob], `captura-pantalla-${Date.now()}.png`, {
                type: 'image/png'
            });

            await uploadImage(file);
        } catch (err) {
            console.error('Error capturando pantalla:', err);
            setError('Error al capturar pantalla: ' + err.message);
        } finally {
            setCapturing(false);
        }
    };

    const createFloatingWindow = () => {
        const floatingWindow = window.open('', '_blank', 
            'width=350,height=250,left=50,top=50,alwaysOnTop=yes,resizable=no,scrollbars=no,status=no,toolbar=no,menubar=no,location=no'
        );

        if (floatingWindow) {
            floatingWindow.document.write(getFloatingWindowHTML());
            floatingWindow.document.close();
        }

        return floatingWindow;
    };

    const getFloatingWindowHTML = () => `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Captura de Escritorio</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    user-select: none;
                }
                .countdown {
                    font-size: 42px;
                    font-weight: bold;
                    margin: 15px 0;
                    color: #ff6b6b;
                    animation: pulse 1s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                .instructions { font-size: 14px; margin: 8px 0; opacity: 0.9; }
                .success {
                    background: rgba(76, 175, 80, 0.3);
                    border: 2px solid #4CAF50;
                    border-radius: 8px;
                    padding: 8px;
                    margin: 8px 0;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <h3>📸 Captura de Escritorio</h3>
            <div class="countdown" id="countdown">10</div>
            <div class="instructions" id="instructions">Preparando captura...</div>
            <div class="success">
                <strong>✅ Pantalla Seleccionada</strong><br>
                ¡Ve a la pantalla que quieres capturar!
            </div>
            <script>
                let countdown = 10;
                const countdownEl = document.getElementById('countdown');
                const instructions = document.getElementById('instructions');
                const updateCountdown = () => {
                    countdownEl.textContent = countdown;
                    if (countdown <= 3) {
                        instructions.textContent = '¡Captura en ' + countdown + ' segundos!';
                        instructions.style.color = '#ff6b6b';
                    } else {
                        instructions.textContent = 'Preparando captura en ' + countdown + ' segundos...';
                    }
                    if (countdown > 0) {
                        countdown--;
                        setTimeout(updateCountdown, 1000);
                    }
                };
                updateCountdown();
                window.focus();
            </script>
        </body>
        </html>
    `;

    const handleDesktopCapture = async (setError) => {
        try {
            setCapturing(true);
            setShowDesktopCapture(true);
            setError(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('La captura de pantalla no está disponible en este navegador');
            }

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920, max: 3840 },
                    height: { ideal: 1080, max: 2160 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: false,
                preferCurrentTab: false
            });

            const floatingWindow = createFloatingWindow();

            // Esperar 10 segundos
            await new Promise(resolve => setTimeout(resolve, 10000));

            const blob = await captureFromStream(stream);
            const file = new File([blob], `captura-escritorio-${Date.now()}.png`, {
                type: 'image/png'
            });

            await uploadImage(file);

            await new Promise(resolve => setTimeout(resolve, 1000));

            if (floatingWindow && !floatingWindow.closed) {
                floatingWindow.close();
            }
        } catch (err) {
            console.error('Error capturando escritorio:', err);
            setError('Error al capturar escritorio: ' + err.message);
        } finally {
            setCapturing(false);
            setShowDesktopCapture(false);
        }
    };

    return {
        capturing,
        showDesktopCapture,
        handleScreenCapture,
        handleDesktopCapture
    };
}

export default useScreenCapture;
