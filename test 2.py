import tkinter as tk
from tkinter import messagebox
import csv
import os
import random

CSV_FILE = "aufgaben.csv"

# Funktion zum Speichern einer neuen Aufgabe in die CSV-Datei
def save_task(thema, frage, antwort):
    with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([thema, frage, antwort])

# Funktion zum Laden aller Aufgaben aus der CSV-Datei
def load_tasks():
    if not os.path.exists(CSV_FILE):
        return []
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        return list(csv.reader(f))

# Funktion, um eine zufällige Aufgabe zu bekommen
def get_random_task():
    tasks = load_tasks()
    if not tasks:
        return None
    return random.choice(tasks)

# Login-Funktion mit Auswahl der Nutzergruppe
def login():
    user = entry_user.get()
    pw = entry_pw.get()
    if user == "admin" and pw == "admin123":
        messagebox.showinfo("Login", f"Willkommen, {user}!")
        root.destroy()
        show_admin_menu()
    elif user == "user" and pw == "user123":
        messagebox.showinfo("Login", f"Willkommen, {user}!")
        root.destroy()
        show_user_menu()
    else:
        messagebox.showerror("Login", "Falscher Benutzername oder Passwort")

def logout_and_restart(window):
    window.destroy()
    show_login_window()

# Menü für Admin: Aufgaben hinzufügen oder beenden
def show_admin_menu():
    menu = tk.Tk()
    menu.title("Admin-Menü")
    center_window(menu, 500, 300)
    tk.Label(menu, text="Admin-Menü").pack()
    tk.Button(menu, text="Neue Aufgabe hinzufügen", command=lambda: [menu.destroy(), show_admin_window()]).pack()
    tk.Button(menu, text="Alle Aufgaben anzeigen", command=show_all_tasks).pack()
    tk.Button(menu, text="Logout", command=lambda: logout_and_restart(menu)).pack()
    tk.Button(menu, text="Beenden", command=menu.destroy).pack()
    menu.mainloop()

# Menü für User: Quiz starten oder beenden
def show_user_menu():
    menu = tk.Tk()
    menu.title("User-Menü")
    center_window(menu, 500, 300)
    tk.Label(menu, text="User-Menü").pack()
    tk.Button(menu, text="Quiz starten", command=lambda: [menu.destroy(), show_user_window()]).pack()
    tk.Button(menu, text="Logout", command=lambda: logout_and_restart(menu)).pack()
    tk.Button(menu, text="Beenden", command=menu.destroy).pack()
    menu.mainloop()

def show_login_window():
    login_win = tk.Tk()
    login_win.title("Login")
    center_window(login_win, 500, 300)
    tk.Label(login_win, text="Benutzername:").pack()
    entry_user = tk.Entry(login_win)
    entry_user.pack()
    tk.Label(login_win, text="Passwort:").pack()
    entry_pw = tk.Entry(login_win, show="*")
    entry_pw.pack()
    def login():
        user = entry_user.get()
        pw = entry_pw.get()
        if user == "admin" and pw == "admin123":
            messagebox.showinfo("Login", f"Willkommen, {user}!")
            login_win.destroy()
            show_admin_menu()
        elif user == "user" and pw == "user123":
            messagebox.showinfo("Login", f"Willkommen, {user}!")
            login_win.destroy()
            show_user_menu()
        else:
            messagebox.showerror("Login", "Falscher Benutzername oder Passwort")
    tk.Button(login_win, text="Anmelden", command=login).pack()
    login_win.mainloop()

# Fenster zum Hinzufügen einer neuen Aufgabe (Admin)
def show_admin_window():
    admin = tk.Tk()
    admin.title("Admin: Aufgabe hinzufügen")
    center_window(admin, 500, 300)

    tk.Label(admin, text="Thema:").pack()
    entry_thema = tk.Entry(admin)
    entry_thema.pack()

    tk.Label(admin, text="Frage:").pack()
    entry_frage = tk.Entry(admin)
    entry_frage.pack()

    tk.Label(admin, text="Antwort:").pack()
    entry_antwort = tk.Entry(admin)
    entry_antwort.pack()

    def speichern():
        thema = entry_thema.get()
        frage = entry_frage.get()
        antwort = entry_antwort.get()
        if thema and frage and antwort:
            save_task(thema, frage, antwort)
            messagebox.showinfo("Gespeichert", "Aufgabe gespeichert!")
            entry_thema.delete(0, tk.END)
            entry_frage.delete(0, tk.END)
            entry_antwort.delete(0, tk.END)
        else:
            messagebox.showwarning("Fehler", "Bitte alle Felder ausfüllen.")

    tk.Button(admin, text="Aufgabe speichern", command=speichern).pack()
    tk.Button(admin, text="Zurück zum Menü", command=lambda: [admin.destroy(), show_admin_menu()]).pack()
    admin.mainloop()

# Fenster, um alle Aufgaben anzuzeigen (Admin)
def show_all_tasks():
    tasks = load_tasks()
    window = tk.Tk()
    window.title("Alle Aufgaben")
    center_window(window, 500, 300)
    if not tasks:
        tk.Label(window, text="Keine Aufgaben vorhanden.").pack()
    else:
        for aufgabe in tasks:
            tk.Label(window, text=f"Thema: {aufgabe[0]}").pack()
            tk.Label(window, text=f"Frage: {aufgabe[1]}").pack()
            tk.Label(window, text=f"Antwort: {aufgabe[2]}").pack()
            tk.Label(window, text="-------------------").pack()
    tk.Button(window, text="Schließen", command=window.destroy).pack()
    window.mainloop()

# Fenster für User: Eine zufällige Aufgabe lösen
def show_user_window():
    aufgabe = get_random_task()
    user_win = tk.Tk()
    user_win.title("Aufgabe lösen")
    center_window(user_win, 500, 300)

    if aufgabe:
        tk.Label(user_win, text=f"Thema: {aufgabe[0]}").pack()
        tk.Label(user_win, text=f"Frage: {aufgabe[1]}").pack()
        tk.Label(user_win, text="Antwort:").pack()
        entry_user_antwort = tk.Entry(user_win)
        entry_user_antwort.pack()

        def pruefen():
            if entry_user_antwort.get().strip().lower() == aufgabe[2].strip().lower():
                messagebox.showinfo("Richtig", "Antwort ist korrekt!")
            else:
                messagebox.showerror("Falsch", f"Falsch! Die richtige Antwort ist: {aufgabe[2]}")
            user_win.destroy()
            show_user_menu()

        tk.Button(user_win, text="Antwort prüfen", command=pruefen).pack()
    else:
        tk.Label(user_win, text="Keine Aufgaben vorhanden.").pack()
        tk.Button(user_win, text="Zurück zum Menü", command=lambda: [user_win.destroy(), show_user_menu()]).pack()
        return

    tk.Button(user_win, text="Zurück zum Menü", command=lambda: [user_win.destroy(), show_user_menu()]).pack()
    user_win.mainloop()

def center_window(window, width=500, height=300):
    window.update_idletasks()
    screen_width = window.winfo_screenwidth()
    screen_height = window.winfo_screenheight()
    x = (screen_width // 2) - (width // 2)
    y = (screen_height // 2) - (height // 2)
    window.geometry(f"{width}x{height}+{x}+{y}")

# --- Start: Login-Fenster ---
show_login_window()
