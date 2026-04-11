# -*- coding: utf-8 -*-

"""
generate_car_qrcodes.py

Ein eigenständiges Skript zum Crawlen von Fahrzeug-URLs auf
https://www.autozentrum-wardenburg.de/fahrzeugbestand/ und zum Generieren
individueller QR-Codes für jedes gefundene Fahrzeug.

Voraussetzungen:
pip install requests beautifulsoup4 "qrcode[pil]"

Ausführung:
python generate_car_qrcodes.py
"""

import logging
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import urljoin, urlparse

# qrcode-Import muss nach der Installation von qrcode[pil] erfolgen
import qrcode
from qrcode.image.pil import PilImage

# --- Konfiguration ---
# Die Basis-URL des Autohauses
BASE_URL = "https://www.autozentrum-wardenburg.de"
# Der Startpfad für die Fahrzeugliste
INVENTORY_PATH = "/fahrzeugbestand/"
# Name des Ordners, in dem die QR-Codes gespeichert werden
OUTPUT_DIR = Path("output_qrcodes")
# --- Ende der Konfiguration ---


def setup_logging():
    """Konfiguriert ein einfaches Logging für die Konsolenausgabe."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def fetch_all_vehicle_urls(start_url: str) -> set[str]:
    """
    Sammelt die URLs aller Fahrzeug-Detailseiten, indem es durch die Paginierung navigiert.

    Args:
        start_url: Die URL der ersten Seite der Fahrzeugliste.

    Returns:
        Ein Set von eindeutigen, absoluten URLs zu den Fahrzeugen.
    """
    vehicle_urls = set()
    current_page_url = start_url
    page_count = 1

    # Setzt einen User-Agent, um sich als normaler Browser auszugeben
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
    }

    while current_page_url:
        logging.info(f"Durchsuche Seite {page_count}: {current_page_url}")
        try:
            response = requests.get(current_page_url, headers=headers, timeout=15)
            response.raise_for_status()  # Löst einen Fehler bei 4xx/5xx HTTP-Status aus
        except requests.RequestException as e:
            logging.error(f"Fehler beim Abrufen der Seite {current_page_url}: {e}")
            break

        soup = BeautifulSoup(response.text, "lxml")

        # Finde alle Links, die auf ein Fahrzeugdetail verweisen
        # Der CSS-Selektor 'a.vehicle-item__link' zielt auf die Links der Fahrzeugkacheln
        links_on_page = soup.select("a.vehicle-item__link")
        if not links_on_page:
            logging.warning(f"Keine Fahrzeuglinks auf Seite {page_count} gefunden. Möglicherweise hat sich die Seitenstruktur geändert.")
            break
            
        for link in links_on_page:
            href = link.get("href")
            if href:
                # Wandelt relative URLs (z.B. /fahrzeug/123) in absolute URLs um
                absolute_url = urljoin(BASE_URL, href)
                vehicle_urls.add(absolute_url)

        # Finde den Link zur nächsten Seite
        next_page_link = soup.select_one("a.pagination__item--next")
        if next_page_link and next_page_link.get("href"):
            current_page_url = urljoin(BASE_URL, next_page_link.get("href"))
            page_count += 1
        else:
            logging.info("Keine 'Nächste Seite' mehr gefunden. Suche beendet.")
            current_page_url = None

    return vehicle_urls


def create_qr_code_for_url(url: str, output_folder: Path):
    """
    Erstellt einen QR-Code für eine gegebene URL und speichert ihn als PNG-Datei.

    Args:
        url: Die URL, die im QR-Code kodiert werden soll.
        output_folder: Der Ordner, in dem die PNG-Datei gespeichert wird.
    """
    try:
        # Extrahiere eine eindeutige ID aus der URL für den Dateinamen
        # z.B. aus '.../fahrzeugbestand/1234567/' wird 'car_1234567.png'
        path_parts = [part for part in urlparse(url).path.split('/') if part]
        vehicle_id = path_parts[-1] if path_parts else "unknown"
        filename = f"car_{vehicle_id}.png"
        output_path = output_folder / filename

        # Erstelle den QR-Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Speichere als Bilddatei
        img = qr.make_image(fill_color="black", back_color="white", image_factory=PilImage)
        img.save(output_path)
        logging.info(f"QR-Code erfolgreich erstellt für Fahrzeug-ID {vehicle_id} -> {output_path.name}")

    except Exception as e:
        logging.error(f"Konnte QR-Code für URL {url} nicht erstellen: {e}")


def main():
    """Hauptfunktion des Skripts."""
    setup_logging()
    logging.info("Starte den QR-Code Generator für das Autozentrum Wardenburg.")

    # 1. Erstelle den Ausgabeordner, falls er nicht existiert
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    logging.info(f"Die QR-Codes werden im Ordner '{OUTPUT_DIR.resolve()}' gespeichert.")

    # 2. Sammle alle Fahrzeug-URLs von der Website
    start_url = urljoin(BASE_URL, INVENTORY_PATH)
    all_urls = fetch_all_vehicle_urls(start_url)

    if not all_urls:
        logging.warning("Keine Fahrzeug-URLs gefunden. Das Skript wird beendet.")
        return

    logging.info(f"Insgesamt {len(all_urls)} einzigartige Fahrzeuge gefunden. Generiere nun die QR-Codes...")

    # 3. Gehe durch jede URL und erstelle einen QR-Code dafür
    for i, url in enumerate(sorted(list(all_urls))): # Sortiert für eine konsistente Reihenfolge
        logging.info(f"Verarbeite Fahrzeug {i+1}/{len(all_urls)}...")
        create_qr_code_for_url(url, OUTPUT_DIR)

    logging.info("---")
    logging.info(f"Alle {len(all_urls)} QR-Codes wurden erfolgreich generiert!")
    logging.info(f"Sie finden die PNG-Dateien in: {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    main()