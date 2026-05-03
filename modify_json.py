import json

with open('ap1-lernapp/fragen.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

lf_map = {
  "Projektmanagement": "LF11: IT-Projekte begleiten",
  "Qualitätsmanagement": "LF11: IT-Projekte begleiten",
  "IT-Sicherheit & Datenschutz": "LF2: IT-Arbeitsplätze ausstatten",
  "IT-Systeme & Hardware": "LF2: IT-Arbeitsplätze ausstatten",
  "Netzwerktechnik": "LF4: Netzwerke und Dienste bereitstellen",
  "Software & Programmierung": "LF6: Anwendungen entwickeln",
  "Arbeits- & Geschäftsprozesse": "LF1: Das Unternehmen präsentieren",
  "Verträge & Leistungserbringung": "LF1: Das Unternehmen präsentieren",
  "Elektrotechnik & Rechnen": "LF2: IT-Arbeitsplätze ausstatten",
  "IoT & MQTT": "LF7: Cyber-physische Systeme",
  "Barrierefreiheit & Präsentation": "LF1: Das Unternehmen präsentieren"
}

for t in data:
    if t['thema'] in lf_map:
        t['lernfeld'] = lf_map[t['thema']]
    else:
        t['lernfeld'] = "Sonstiges"

data.append({
  "lernfeld": "LF8: Daten systemübergreifend bereitstellen",
  "thema": "Datenbanken & SQL",
  "emoji": "🗄️",
  "fragen": [
    {
      "typ": "multi_freitext",
      "frage": "Ergänze die Grundbegriffe relationaler Datenbanken:",
      "antworten": [
        {"label": "Eindeutiger Identifikator eines Datensatzes", "loesung": "Primärschlüssel"},
        {"label": "Referenz auf einen Primärschlüssel einer anderen Tabelle", "loesung": "Fremdschlüssel"}
      ]
    },
    {
      "typ": "multi_freitext",
      "frage": "Bringe die Normalformen der Normalisierung zusammen:",
      "antworten": [
        {"label": "1. Normalform", "loesung": "Atomare Werte"},
        {"label": "2. Normalform", "loesung": "Volle funktionale Abhängigkeit"},
        {"label": "3. Normalform", "loesung": "Keine transitiven Abhängigkeiten"}
      ]
    },
    {
      "typ": "multi_freitext",
      "frage": "Nenne die 3 Mutationsanomalien bei fehlerhafter Datenbank-Normalisierung:",
      "antworten": [
        {"label": "Anomalie 1", "loesung": "Einfügeanomalie"},
        {"label": "Anomalie 2", "loesung": "Löschanomalie"},
        {"label": "Anomalie 3", "loesung": "Änderungsanomalie"}
      ]
    },
    {
      "typ": "mc",
      "frage": "Welcher SQL Befehl fasst Zeilen zusammen, die in bestimmten Spalten gleiche Werte haben?",
      "optionen": ["ORDER BY", "JOIN", "GROUP BY", "WHERE"],
      "antwort": 2
    },
    {
      "typ": "multi_freitext",
      "frage": "Zuordnung der Beziehungsarten in ER-Modellen:",
      "antworten": [
        {"label": "Verbindung zwischen Master- und Detailtabelle", "loesung": "1:n"},
        {"label": "Beziehung, die meist über eine Verbindungstabelle aufgelöst werden muss", "loesung": "m:n"}
      ]
    }
  ]
})

with open('ap1-lernapp/fragen.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('JSON updated successfully!')
