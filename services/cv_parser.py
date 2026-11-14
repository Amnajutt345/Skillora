import pymupdf
import pytesseract
from PIL import Image
from pypdf import PdfReader

# Windows ke liye Tesseract ka exact path
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


def extract_text_from_pdf(file_path: str):
    reader = PdfReader(file_path)

    extracted_text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            extracted_text += page_text + "\n"

    # Refined check: Agar PDF mein readable text hai aur CV ke keywords bhi maujood hain
    if (
        len(extracted_text.strip()) > 30
        and any(
            word in extracted_text.lower()
            for word in ["skills", "experience", "education", "summary", "email"]
        )
    ):
        return extracted_text.strip()

    # Otherwise, use PyMuPDF and OCR for scanned PDFs
    document = pymupdf.open(file_path)

    ocr_text = ""

    for page in document:
        pix = page.get_pixmap(
            dpi=300,
            colorspace=pymupdf.csRGB,
            alpha=False
        )

        image = Image.frombytes(
            "RGB",
            [pix.width, pix.height],
            pix.samples
        )

        page_text = pytesseract.image_to_string(image)
        ocr_text += page_text + "\n"

    document.close()

    return ocr_text.strip()