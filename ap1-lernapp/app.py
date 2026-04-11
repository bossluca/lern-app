import webview
import os

def start_app():
    # Konstruiere den absoluten Pfad zur HTML-Datei
    html_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'notion-demo.html')

    # Erstelle das echte Desktop-Fenster mit unserer Web-Engine
    window = webview.create_window(
        'Notion Desktop Klon', 
        url=f'file:///{html_file.replace(os.sep, "/")}', # Konvertiere Pfad-Trenner für URL 
        width=1100, 
        height=850,
        background_color='#1a1a2e',
        text_select=True # Erlaube Textauswahl
    )

    # Starte die App-Schleife
    webview.start()

if __name__ == '__main__':
    start_app()
