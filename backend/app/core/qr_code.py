from io import BytesIO
from typing import Optional
import qrcode
from qrcode.constants import ERROR_CORRECT_M
from PIL import Image


def generate_qr_bytes(data_str: str, box_size: int = 5, border: int = 2) -> bytes:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data_str)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    if not isinstance(img, Image.Image):
        img = img.convert("RGB")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def generate_barcode_bytes(data_str: str) -> Optional[bytes]:
    try:
        from barcode import Code128
        from barcode.writer import ImageWriter
    except ImportError:
        return None
    try:
        rv = BytesIO()
        writer = ImageWriter()
        Code128(str(data_str), writer=writer).write(rv, options={"write_text": True, "quiet_zone": 2})
        rv.seek(0)
        return rv.getvalue()
    except Exception:
        return None
