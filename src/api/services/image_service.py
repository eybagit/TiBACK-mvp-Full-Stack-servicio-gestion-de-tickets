"""
ImageService - Lógica de negocio para imágenes
Según documentacion/modular.md: Servicios contienen lógica de negocio pura.
"""
import os
import cloudinary
import cloudinary.uploader


class ImageService:
    """Servicio para operaciones de imágenes"""

    PLACEHOLDER_SVG = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=="
    ERROR_PLACEHOLDER_SVG = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIHN1YmllbmRvIGltYWdlbjwvdGV4dD48L3N2Zz4="

    @staticmethod
    def is_cloudinary_configured():
        """Verificar si Cloudinary está configurado"""
        return bool(os.getenv('CLOUDINARY_URL'))

    @staticmethod
    def configure_cloudinary():
        """Configurar Cloudinary con CLOUDINARY_URL"""
        cloudinary_url = os.getenv('CLOUDINARY_URL')
        if cloudinary_url:
            cloudinary.config(cloudinary_url=cloudinary_url)
            return True
        return False

    @staticmethod
    def upload_image(file, folder="tickets"):
        """Subir imagen a Cloudinary"""
        if not ImageService.is_cloudinary_configured():
            if not ImageService.configure_cloudinary():
                return {
                    "url": ImageService.PLACEHOLDER_SVG,
                    "public_id": "placeholder"
                }, False

        try:
            upload_result = cloudinary.uploader.upload(
                file,
                folder=folder,
                resource_type="image"
            )
            return {
                "url": upload_result['secure_url'],
                "public_id": upload_result['public_id']
            }, True
        except Exception as e:
            return {
                "url": ImageService.ERROR_PLACEHOLDER_SVG,
                "public_id": "error_placeholder",
                "error": str(e)
            }, False

    @staticmethod
    def get_cloudinary_status():
        """Obtener estado de configuración de Cloudinary"""
        return {
            "cloudinary_configured": ImageService.is_cloudinary_configured()
        }
