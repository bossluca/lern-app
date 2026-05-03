const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ap1-lernapp/fragen.json', 'utf8'));

const lfMap = {
  "Projektmanagement": "LF11: IT-Projekte begleiten",
  "Qualitätsmanagement": "LF11: IT-Projekte begleiten",
  "IT-Sicherheit & Datenschutz": "LF2: IT-Arbeitsplätze ausstatten",
  "IT-Systeme & Hardware": "LF2: IT-Arbeitsplätze ausstatten",
  "Netzwerktechnik": "LF4: Netzwerke und Dienste bereitstellen",
  "Software & Programmierung": "LF6: Anwendungen entwickeln",
  "Arbeits- & Geschäftsprozesse": "LF1: Das Unternehmen präsentieren",
  "Verträge & Leistungserbringung": "LF1: Das Unternehmen präsentieren",
  "Elektrotechnik & Rechnen": "LF2: IT-Arbeitsplätze ausstatten",
  "IoT & MQTT": "LF7: Cyber-physische Systeme ergänzen",
  "Barrierefreiheit & Präsentation": "LF1: Das Unternehmen präsentieren"
};

for (const t of data) {
  if (lfMap[t.thema]) {
    t.lernfeld = lfMap[t.thema];
  } else {
    t.lernfeld = "Sonstiges";
  }
}

// Add new LF8 topic
data.push({
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
      "frage": "Nenne die 3 Mutationsanomalien bei fehlerhafter Datanbank-Normalisierung:",
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
});

fs.writeFileSync('ap1-lernapp/fragen.json', JSON.stringify(data, null, 2), 'utf8');
console.log('JSON updated successfully!');
