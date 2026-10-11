import io
import json
import zipfile

from PIL import Image

IMAGE_PATH = "images/pizza-polowa.png"


def ebook_content():
    return {
        "section": "Ułamki proste",
        "subsection": "Kawałki całości",
        "title": "Kawałki całości",
        "intro": "Czym jest ułamek? Poznanie na przykładach.",
        "blocks": [
            {"type": "heading", "text": "Ułamek to część całości"},
            {"type": "paragraph", "text": "Ułamek pokazuje, na ile równych części podzielono całość."},
            {"type": "list", "items": ["licznik", "mianownik"]},
            {"type": "callout", "style": "zapamietaj", "text": "Mianownik mówi, na ile części dzielimy."},
            {"type": "subheading", "text": "Połowa pizzy — 1/2"},
            {"type": "image", "file": IMAGE_PATH, "alt": "Pizza przekrojona na pół"},
        ],
    }


def png_bytes():
    buffer = io.BytesIO()
    Image.new("RGB", (4, 3), "white").save(buffer, format="PNG")
    return buffer.getvalue()


def build_ebook_zip(ebook_json=None, images=(IMAGE_PATH,), root="kawalki-calosci"):
    if ebook_json is None:
        ebook_json = json.dumps(ebook_content(), ensure_ascii=False)

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr(f"{root}/ebook.json", ebook_json)
        for path in images:
            archive.writestr(f"{root}/{path}", png_bytes())
    buffer.seek(0)
    return buffer


def import_ebook(client, archive):
    return client.post(
        "/api/admin/ebooks/import",
        data={"file": (archive, "kawalki-calosci.zip")},
        content_type="multipart/form-data",
        headers={"Authorization": "Bearer test-token"},
    )
