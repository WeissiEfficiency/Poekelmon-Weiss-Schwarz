// Einstellungen dieser Installation. Erzeugt und geändert mit: python tools/setup.py
// Die Firebase-Werte sind nicht geheim: Sie stehen bei jeder Firebase-Web-App im Browser.
// Geschützt wird die Datenbank über firestore.rules (Firebase-Konsole > Firestore > Regeln).
// Steht bei projectId "DEIN-PROJEKT", speichert die Seite nur lokal im Browser.
window.SOULLINK_CONFIG = {
  firebase: {
    apiKey: "AIzaSyCdG6vfkO1rdx-k6ILrJs7lYWJiNq9lRtI",
    authDomain: "soul-link-weiss-schwarz.firebaseapp.com",
    projectId: "soul-link-weiss-schwarz",
    storageBucket: "soul-link-weiss-schwarz.firebasestorage.app",
    messagingSenderId: "468534676112",
    appId: "1:468534676112:web:e354cb4035288e9bc9a615"
  },
  // Anzahl der Spieler (2 bis 6). Namen trägt man auf der Seite ein.
  playerCount: 3,
  // Firebase-Kennung (UID) des Admins: darf Backups machen und andere freischalten.
  // Muss mit der UID in firestore.rules übereinstimmen (tools/setup.py hält beide gleich).
  adminUid: "3jGRsgfX3DcYPwOTzzTWJBm8EJF2",
  // Letztes automatisches Backup (GitHub Action, tools/backup.py). Dient nur der Backup-Erinnerung.
  autoBackupUrl: "https://raw.githubusercontent.com/WeissiEfficiency/Poekelmon-Weiss-Schwarz/main/backups/latest.json"
};
