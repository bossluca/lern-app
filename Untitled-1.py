# diagnose.py
import requests
import logging

# Konfiguration
URL = "https://www.autozentrum-wardenburg.de/fahrzeugbestand/"
OUTPUT_FILE = "diagnose_output.html"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
}

# Logging einrichten
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

def check_content():
    """Lädt den HTML-Inhalt und speichert ihn in einer Datei."""
    logging.info(f"Versuche, Inhalt von {URL} abzurufen...")
    try:
        response = requests.get(URL, headers=HEADERS, timeout=20)
        response.raise_for_status()
        
        content = response.text
        logging.info(f"Anfrage erfolgreich. {len(content)} Zeichen empfangen.")
        
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            f.write(content)
            
        logging.info(f"Inhalt wurde erfolgreich in '{OUTPUT_FILE}' gespeichert.")
        logging.info(f"Bitte öffnen Sie nun diese Datei in Ihrem Browser, um das Ergebnis zu sehen.")

    except requests.RequestException as e:
        logging.error(f"Fehler bei der Anfrage: {e}")

if __name__ == "__main__":
    check_content()