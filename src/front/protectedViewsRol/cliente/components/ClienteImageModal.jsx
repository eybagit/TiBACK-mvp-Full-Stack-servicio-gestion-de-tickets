import React from 'react';

/**
 * ClienteImageModal - Modal carrusel para ver imágenes de tickets
 */
function ClienteImageModal({
    selectedTicketImages,
    selectedImageIndex,
    setSelectedTicketImages,
    setSelectedImageIndex
}) {
    if (!selectedTicketImages) return null;

    return (
        <div className="modal fade show modal-show-transparent" tabIndex="-1" onClick={() => setSelectedTicketImages(null)}>
            <div className="modal-dialog modal-dialog-centered modal-md" onClick={e => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Vista previa</h5>
                        <button type="button" className="btn-close" onClick={() => setSelectedTicketImages(null)}></button>
                    </div>
                    <div className="modal-body text-center">
                        <div className="position-relative">
                            <img src={selectedTicketImages[selectedImageIndex]} alt={`img-${selectedImageIndex}`} className="img-fluid rounded img-preview-lg" />
                            {selectedTicketImages.length > 1 && (
                                <>
                                    <button className="btn btn-secondary position-absolute top-50 start-0 translate-middle-y btn-carousel-nav" onClick={() => setSelectedImageIndex((prev) => (prev - 1 + selectedTicketImages.length) % selectedTicketImages.length)}>‹</button>
                                    <button className="btn btn-secondary position-absolute top-50 end-0 translate-middle-y btn-carousel-nav" onClick={() => setSelectedImageIndex((prev) => (prev + 1) % selectedTicketImages.length)}>›</button>
                                </>
                            )}
                        </div>
                        <div className="mt-2">
                            {selectedTicketImages.map((_, idx) => (
                                <span key={idx} className={`mx-1 rounded-circle carousel-dot ${idx === selectedImageIndex ? 'bg-primary' : 'bg-secondary'}`} onClick={() => setSelectedImageIndex(idx)}></span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show modal-backdrop-behind" onClick={() => setSelectedTicketImages(null)}></div>
        </div>
    );
}

export default ClienteImageModal;
