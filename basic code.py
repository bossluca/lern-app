import tkinter as tk
from tkinter import messagebox

def login():
    user = entry_user.get()
    pw = entry_pw.get()
    if user == "admin" and pw == "admin123":
        messagebox.showinfo("Login", "Willkommen, Admin!")
        root.destroy()
        admin_menu()
    elif user == "user" and pw == "user123":
        messagebox.showinfo("Login", "Willkommen, User!")
        root.destroy()
        user_menu()
    else:
        messagebox.showerror("Login", "Falscher Benutzername oder Passwort")

root = tk.Tk()
root.title("Login")
tk.Label(root, text="Benutzername:").pack()
entry_user = tk.Entry(root)
entry_user.pack()
tk.Label(root, text="Passwort:").pack()
entry_pw = tk.Entry(root, show="*")
entry_pw.pack()
tk.Button(root, text="Anmelden", command=login).pack()
root.mainloop()


def admin_menu():
    win = tk.Tk()
    win.title("Admin-Menü")
    tk.Button(win, text="Aufgabe anlegen", command=lambda: [win.destroy(), aufgabe_anlegen()]).pack()
    tk.Button(win, text="Beenden", command=win.destroy).pack()
    win.mainloop()

def user_menu():
    win = tk.Tk()
    win.title("User-Menü")
    tk.Button(win, text="Quiz starten", command=lambda: [win.destroy(), quiz_starten()]).pack()
    tk.Button(win, text="Beenden", command=win.destroy).pack()
    win.mainloop()


import csv
import os

CSV_FILE = "aufgaben.csv"

def aufgabe_anlegen():
    win = tk.Tk()
    win.title("Neue Aufgabe")

    tk.Label(win, text="Thema:").pack()
    entry_thema = tk.Entry(win)
    entry_thema.pack()
    tk.Label(win, text="Frage:").pack()
    entry_frage = tk.Entry(win)
    entry_frage.pack()
    tk.Label(win, text="Antwort:").pack()
    entry_antwort = tk.Entry(win)
    entry_antwort.pack()

    def speichern():
        with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([entry_thema.get(), entry_frage.get(), entry_antwort.get()])
        messagebox.showinfo("Gespeichert", "Aufgabe gespeichert!")
        win.destroy()
        admin_menu()

    tk.Button(win, text="Speichern", command=speichern).pack()
    win.mainloop()

def quiz_starten():
    if not os.path.exists(CSV_FILE):
        messagebox.showinfo("Hinweis", "Noch keine Aufgaben vorhanden!")
        user_menu()
        return
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = list(csv.reader(f))
    if not reader:
        messagebox.showinfo("Hinweis", "Noch keine Aufgaben vorhanden!")
        user_menu()
        return

    # Eine Frage nach der anderen abfragen
    def frage_zeigen(index=0, punkte=0):
        if index >= len(reader):
            messagebox.showinfo("Fertig", f"Du hast {punkte} von {len(reader)} richtig!")
            user_menu()
            return
        aufgabe = reader[index]
        win = tk.Tk()
        win.title(f"Frage {index+1}")
        tk.Label(win, text=f"Thema: {aufgabe[0]}").pack()
        tk.Label(win, text=f"Frage: {aufgabe[1]}").pack()
        entry = tk.Entry(win)
        entry.pack()
        def check():
            if entry.get().strip().lower() == aufgabe[2].strip().lower():
                messagebox.showinfo("Richtig", "Antwort ist korrekt!")
                win.destroy()
                frage_zeigen(index+1, punkte+1)
            else:
                messagebox.showinfo("Falsch", f"Falsch! Die richtige Antwort ist: {aufgabe[2]}")
                win.destroy()
                frage_zeigen(index+1, punkte)
        tk.Button(win, text="Antwort prüfen", command=check).pack()
        win.mainloop()
    frage_zeigen()
