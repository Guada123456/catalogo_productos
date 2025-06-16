import sqlite3
import os

DATABASE = 'database.db' # Nombre del archivo de la base de datos

def init_db():
    # Verifica si el archivo de la base de datos ya existe
    if os.path.exists(DATABASE):
        print("Base de datos ya existe, no se creará de nuevo.")
        return

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # Tabla de productos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            imageUrl TEXT
        )
    ''')

    # Tabla de usuarios (para el administrador)
    # NOTA: Para una aplicación real, las contraseñas deben ser hasheadas (ej. con bcrypt)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')

    # Insertar un usuario administrador por defecto si no existe
    # ¡CAMBIA 'admin' y 'adminpass' por tus propias credenciales seguras!
    try:
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", ('guada123', 'guada123'))
        print("Usuario administrador por defecto creado.")
    except sqlite3.IntegrityError:
        print("Usuario administrador 'admin' ya existe.")
    
    conn.commit()
    conn.close()
    print("Base de datos inicializada (si no existía).")

if __name__ == '__main__':
    init_db()