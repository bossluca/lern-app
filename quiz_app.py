import tkinter as tk
from tkinter import messagebox, font
import csv
import os
import random

# ── Konfiguration ──────────────────────────────────────────────────────────────
CSV_FILE = "aufgaben.csv"

ADMIN_USER = "admin"
ADMIN_PW   = "admin123"
USER_USER  = "user"
USER_PW    = "user123"

# ── Design-Konstanten ──────────────────────────────────────────────────────────
BG        = "#1e1e2e"      # Hintergrund (dunkel)
BG2       = "#2a2a3e"      # Karten-Hintergrund
ACCENT    = "#7c6af7"      # Lila Akzent
ACCENT2   = "#5a4fd6"      # Dunkler Akzent (Hover)
GREEN     = "#4ade80"      # Für „Richtig"
RED       = "#f87171"      # Für „Falsch"
TEXT      = "#e2e8f0"      # Haupttext (hell)
SUBTEXT   = "#94a3b8"      # Untertext (grau)

BTN_STYLE = {
    "bg": ACCENT, "fg": "white", "activebackground": ACCENT2,
    "activeforeground": "white", "relief": "flat", "cursor": "hand2",
    "padx": 20, "pady": 8, "bd": 0,
}
ENTRY_STYLE = {
    "bg": BG2, "fg": TEXT, "insertbackground": TEXT,
    "relief": "flat", "bd": 0, "highlightthickness": 2,
    "highlightbackground": ACCENT, "highlightcolor": ACCENT,
}


# ── CSV-Hilfsfunktionen ────────────────────────────────────────────────────────
def load_tasks() -> list[list[str]]:
    """Lädt alle Aufgaben aus der CSV und filtert leere Zeilen."""
    if not os.path.exists(CSV_FILE):
        return []
    try:
        with open(CSV_FILE, "r", encoding="utf-8") as f:
            return [row for row in csv.reader(f) if len(row) == 3 and any(row)]
    except OSError as e:
        messagebox.showerror("Fehler", f"CSV konnte nicht gelesen werden:\n{e}")
        return []


def save_tasks(tasks: list[list[str]]) -> None:
    """Überschreibt die CSV mit der gegebenen Aufgabenliste."""
    try:
        with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerows(tasks)
    except OSError as e:
        messagebox.showerror("Fehler", f"CSV konnte nicht gespeichert werden:\n{e}")


def append_task(thema: str, frage: str, antwort: str) -> None:
    """Hängt eine neue Aufgabe an die CSV an."""
    try:
        with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow([thema, frage, antwort])
    except OSError as e:
        messagebox.showerror("Fehler", f"Aufgabe konnte nicht gespeichert werden:\n{e}")


# ── Haupt-App-Klasse ───────────────────────────────────────────────────────────
class QuizApp:
    """Verwaltet das Hauptfenster und alle Screens der Quiz-Anwendung."""

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Quiz App")
        self.root.configure(bg=BG)
        self._center(self.root, 560, 420)
        self.root.resizable(False, False)

        # Schriften (nach window-Erzeugung)
        self.font_title  = font.Font(family="Segoe UI", size=20, weight="bold")
        self.font_label  = font.Font(family="Segoe UI", size=11)
        self.font_sub    = font.Font(family="Segoe UI", size=9)
        self.font_btn    = font.Font(family="Segoe UI", size=10, weight="bold")
        self.font_big    = font.Font(family="Segoe UI", size=14, weight="bold")

        # Zustand
        self.current_frame: tk.Frame | None = None
        self._show_login()

    # ── Navigation ─────────────────────────────────────────────────────────────
    def _switch(self, frame: tk.Frame) -> None:
        """Ersetzt den aktuellen Screen durch einen neuen Frame."""
        if self.current_frame:
            self.current_frame.destroy()
        self.current_frame = frame
        frame.pack(fill="both", expand=True, padx=30, pady=30)

    @staticmethod
    def _center(win: tk.Wm, w: int, h: int) -> None:
        win.update_idletasks()
        x = (win.winfo_screenwidth()  // 2) - (w // 2)
        y = (win.winfo_screenheight() // 2) - (h // 2)
        win.geometry(f"{w}x{h}+{x}+{y}")

    # ── Wiederverwendbare Widget-Helfer ────────────────────────────────────────
    def _make_card(self) -> tk.Frame:
        return tk.Frame(self.root, bg=BG2, bd=0)

    def _label(self, parent, text, big=False, sub=False, **kw) -> tk.Label:
        f = self.font_big if big else (self.font_sub if sub else self.font_label)
        return tk.Label(parent, text=text, bg=parent["bg"], fg=SUBTEXT if sub else TEXT, font=f, **kw)

    def _title(self, parent, text) -> tk.Label:
        lbl = tk.Label(parent, text=text, bg=parent["bg"], fg=TEXT,
                       font=self.font_title)
        lbl.pack(pady=(0, 20))
        return lbl

    def _btn(self, parent, text, cmd, color=None, full=False) -> tk.Button:
        style = {**BTN_STYLE, "font": self.font_btn}
        if color:
            style["bg"] = color
        btn = tk.Button(parent, text=text, command=cmd, **style)
        if full:
            btn.pack(fill="x", pady=4)
        else:
            btn.pack(pady=4)
        return btn

    def _entry(self, parent, show=None) -> tk.Entry:
        e = tk.Entry(parent, show=show, font=self.font_label, width=32, **ENTRY_STYLE)
        e.pack(pady=(2, 10), ipady=6)
        return e

    def _divider(self, parent) -> None:
        tk.Frame(parent, bg=ACCENT, height=2).pack(fill="x", pady=(0, 16))

    # ── Screens ───────────────────────────────────────────────────────────────
    def _show_login(self) -> None:
        card = self._make_card()
        self._title(card, "🎓  Quiz App")
        self._divider(card)

        self._label(card, "Benutzername").pack(anchor="w")
        e_user = self._entry(card)

        self._label(card, "Passwort").pack(anchor="w")
        e_pw = self._entry(card, show="•")

        def login():
            u, p = e_user.get().strip(), e_pw.get().strip()
            if u == ADMIN_USER and p == ADMIN_PW:
                self._show_admin_menu()
            elif u == USER_USER and p == USER_PW:
                self._show_user_menu()
            else:
                messagebox.showerror("Login fehlgeschlagen",
                                     "Benutzername oder Passwort falsch.")

        self.root.bind("<Return>", lambda _: login())
        self._btn(card, "Anmelden  →", login, full=True)
        self._label(card, "admin / admin123  |  user / user123", sub=True).pack(pady=(8, 0))
        self._switch(card)

    # ── Admin-Bereich ──────────────────────────────────────────────────────────
    def _show_admin_menu(self) -> None:
        card = self._make_card()
        self._title(card, "⚙️  Admin-Menü")
        self._divider(card)
        self._btn(card, "➕  Neue Aufgabe hinzufügen", self._show_admin_add, full=True)
        self._btn(card, "📋  Alle Aufgaben anzeigen / löschen", self._show_admin_list, full=True)
        tk.Frame(card, bg=BG2, height=12).pack()
        self._btn(card, "Logout", self._show_login, color="#475569", full=True)
        self._switch(card)

    def _show_admin_add(self) -> None:
        card = self._make_card()
        self._title(card, "➕  Aufgabe hinzufügen")
        self._divider(card)

        self._label(card, "Thema").pack(anchor="w")
        e_thema = self._entry(card)
        self._label(card, "Frage").pack(anchor="w")
        e_frage = self._entry(card)
        self._label(card, "Antwort").pack(anchor="w")
        e_antwort = self._entry(card)

        def speichern():
            t, f, a = e_thema.get().strip(), e_frage.get().strip(), e_antwort.get().strip()
            if not (t and f and a):
                messagebox.showwarning("Fehler", "Bitte alle Felder ausfüllen.")
                return
            append_task(t, f, a)
            messagebox.showinfo("Gespeichert", "✅ Aufgabe wurde gespeichert!")
            for e in (e_thema, e_frage, e_antwort):
                e.delete(0, tk.END)

        row = tk.Frame(card, bg=BG2)
        row.pack(fill="x", pady=(6, 0))
        tk.Button(row, text="💾  Speichern", command=speichern,
                  font=self.font_btn, **{**BTN_STYLE}).pack(side="left", expand=True, fill="x", padx=(0, 4))
        tk.Button(row, text="← Zurück", command=self._show_admin_menu,
                  font=self.font_btn, **{**BTN_STYLE, "bg": "#475569"}).pack(side="left", expand=True, fill="x", padx=(4, 0))
        self._switch(card)

    def _show_admin_list(self) -> None:
        card = self._make_card()
        self._title(card, "📋  Alle Aufgaben")
        self._divider(card)

        tasks = load_tasks()

        if not tasks:
            self._label(card, "Keine Aufgaben vorhanden.").pack(pady=20)
        else:
            # Scrollbare Listbox
            frame_lb = tk.Frame(card, bg=BG2)
            frame_lb.pack(fill="both", expand=True)

            sb = tk.Scrollbar(frame_lb)
            sb.pack(side="right", fill="y")

            lb = tk.Listbox(frame_lb, yscrollcommand=sb.set, selectmode="single",
                            bg=BG, fg=TEXT, font=self.font_label,
                            relief="flat", bd=0,
                            selectbackground=ACCENT, selectforeground="white",
                            activestyle="none", height=8)
            for i, t in enumerate(tasks):
                lb.insert(tk.END, f"  {i+1:02d}.  [{t[0]}]  {t[1]}")
            lb.pack(side="left", fill="both", expand=True)
            sb.config(command=lb.yview)

            def loeschen():
                sel = lb.curselection()
                if not sel:
                    messagebox.showwarning("Hinweis", "Bitte eine Aufgabe auswählen.")
                    return
                idx = sel[0]
                aufgabe = tasks[idx]
                if messagebox.askyesno("Löschen?",
                                       f"Aufgabe wirklich löschen?\n\n"
                                       f"Frage: {aufgabe[1]}"):
                    tasks.pop(idx)
                    save_tasks(tasks)
                    self._show_admin_list()   # Refresh

            self._btn(card, "🗑️  Ausgewählte Aufgabe löschen", loeschen, color=RED)

        self._btn(card, "← Zurück", self._show_admin_menu, color="#475569")
        self._switch(card)

    # ── User-Bereich ───────────────────────────────────────────────────────────
    def _show_user_menu(self) -> None:
        card = self._make_card()
        self._title(card, "🙋  User-Menü")
        self._divider(card)
        self._btn(card, "▶  Quiz starten", self._start_quiz, full=True)
        tk.Frame(card, bg=BG2, height=12).pack()
        self._btn(card, "Logout", self._show_login, color="#475569", full=True)
        self._switch(card)

    def _start_quiz(self) -> None:
        tasks = load_tasks()
        if not tasks:
            messagebox.showinfo("Hinweis", "Noch keine Aufgaben vorhanden!")
            return
        random.shuffle(tasks)
        self._show_question(tasks, index=0, score=0)

    def _show_question(self, tasks: list, index: int, score: int) -> None:
        total = len(tasks)

        if index >= total:
            self._show_score(score, total)
            return

        aufgabe = tasks[index]
        card = self._make_card()

        # Fortschrittsanzeige
        prog_txt = f"Frage {index + 1} / {total}"
        prog_row = tk.Frame(card, bg=BG2)
        prog_row.pack(fill="x", pady=(0, 4))
        tk.Label(prog_row, text=prog_txt, bg=BG2, fg=SUBTEXT,
                 font=self.font_sub).pack(side="left")
        tk.Label(prog_row, text=f"✅ {score} richtig", bg=BG2, fg=GREEN,
                 font=self.font_sub).pack(side="right")

        # Fortschrittsbalken
        bar_bg = tk.Frame(card, bg="#374151", height=6)
        bar_bg.pack(fill="x", pady=(0, 16))
        bar_fill_w = max(1, int(index / total * 560))
        tk.Frame(bar_bg, bg=ACCENT, height=6, width=bar_fill_w).place(x=0, y=0)

        self._label(card, f"Thema: {aufgabe[0]}", sub=True).pack(anchor="w")
        self._label(card, aufgabe[1], big=True).pack(anchor="w", pady=(4, 16))

        self._label(card, "Deine Antwort:").pack(anchor="w")
        e_antwort = self._entry(card)
        e_antwort.focus_set()

        result_lbl = tk.Label(card, text="", bg=BG2, font=self.font_label)
        result_lbl.pack()

        answered = [False]

        def pruefen(event=None):
            if answered[0]:
                return
            answered[0] = True
            antwort = e_antwort.get().strip().lower()
            if antwort == aufgabe[2].strip().lower():
                result_lbl.config(text="✅  Richtig!", fg=GREEN)
                new_score = score + 1
            else:
                result_lbl.config(
                    text=f"❌  Falsch! Richtige Antwort: {aufgabe[2]}", fg=RED)
                new_score = score
            e_antwort.config(state="disabled")
            btn_check.config(state="disabled")
            self.root.after(1500, lambda: self._show_question(tasks, index + 1, new_score))

        self.root.unbind("<Return>")
        self.root.bind("<Return>", pruefen)

        btn_check = self._btn(card, "Antwort prüfen  →", pruefen)
        self._switch(card)

    def _show_score(self, score: int, total: int) -> None:
        card = self._make_card()
        pct = int(score / total * 100) if total else 0

        emoji = "🏆" if pct == 100 else ("😊" if pct >= 60 else "📚")
        self._title(card, f"{emoji}  Quiz beendet!")
        self._divider(card)

        tk.Label(card, text=f"{score} / {total}", bg=BG2,
                 fg=ACCENT, font=font.Font(family="Segoe UI", size=48, weight="bold")).pack()
        tk.Label(card, text=f"{pct} % richtig", bg=BG2, fg=SUBTEXT,
                 font=self.font_label).pack(pady=(4, 20))

        msg = ("Perfekt – alle Fragen richtig! 🎉" if pct == 100
               else "Gut gemacht!" if pct >= 60
               else "Weiter üben – du schaffst das!")
        self._label(card, msg).pack(pady=(0, 16))

        row = tk.Frame(card, bg=BG2)
        row.pack(fill="x")
        tk.Button(row, text="🔁  Nochmal",
                  command=self._start_quiz,
                  font=self.font_btn, **BTN_STYLE).pack(side="left", expand=True, fill="x", padx=(0, 4))
        tk.Button(row, text="← Menü",
                  command=self._show_user_menu,
                  font=self.font_btn, **{**BTN_STYLE, "bg": "#475569"}).pack(side="left", expand=True, fill="x", padx=(4, 0))
        self._switch(card)

    # ── Einstiegspunkt ─────────────────────────────────────────────────────────
    def run(self) -> None:
        self.root.mainloop()


if __name__ == "__main__":
    QuizApp().run()
