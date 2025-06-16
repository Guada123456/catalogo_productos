from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import uuid # Para generar nombres únicos para las imágenes

app = Flask(__name__)
CORS(app) # Habilita CORS para permitir que el frontend (en otro puerto) acceda a este backend

DATABASE = 'database.db'
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Asegúrate de que la carpeta de uploads exista
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Funciones de Base de Datos ---
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row # Para acceder a las columnas por nombre
    return conn

# --- Middleware de Autenticación Simple ---
# Para simplificar, usaremos un "token" de sesión simple.
# En una aplicación real, esto se manejaría con JWTs o sesiones de Flask.
# Por ahora, un usuario logueado tendrá un token 'ADMIN_TOKEN_123'
# y este será verificado en cada solicitud de admin.
# ¡CAMBIA ESTE TOKEN POR UNO REALMENTE SEGURO Y COMPLEJO EN PRODUCCIÓN!
ADMIN_AUTH_TOKEN = "guada123" 

def authenticate_admin():
    auth_header = request.headers.get('Authorization')
    if not auth_header or auth_header != f'Bearer {ADMIN_AUTH_TOKEN}':
        return False
    return True

# --- Rutas de la API ---

@app.route('/')
def home():
    return "Backend para el Catálogo de Productos funcionando."

# Autenticación de administrador
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password)).fetchone()
    conn.close()

    if user:
        # En una app real, aquí generarías un JWT o una sesión.
        # Para este ejemplo, simplemente devolvemos un token simple y un mensaje.
        return jsonify({"message": "Login exitoso", "token": ADMIN_AUTH_TOKEN}), 200
    else:
        return jsonify({"message": "Credenciales inválidas"}), 401

# Obtener todos los productos
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    products = conn.execute("SELECT * FROM products").fetchall()
    conn.close()
    return jsonify([dict(row) for row in products])

# Obtener un producto por ID
@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_db_connection()
    product = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()
    if product:
        return jsonify(dict(product))
    return jsonify({"message": "Producto no encontrado"}), 404

# Agregar un nuevo producto (solo admin)
@app.route('/api/products', methods=['POST'])
def add_product():
    if not authenticate_admin():
        return jsonify({"message": "No autorizado"}), 403

    name = request.form.get('name')
    price = request.form.get('price')
    description = request.form.get('description')
    image_file = request.files.get('image')

    if not name or not price:
        return jsonify({"message": "Nombre y precio son requeridos"}), 400
    
    try:
        price = float(price)
    except ValueError:
        return jsonify({"message": "El precio debe ser un número válido"}), 400

    image_url = None
    if image_file:
        filename = str(uuid.uuid4()) + os.path.splitext(image_file.filename)[1] # Nombre único + extensión
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image_file.save(filepath)
        image_url = f'/uploads/{filename}' # URL para acceder a la imagen

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO products (name, price, description, imageUrl) VALUES (?, ?, ?, ?)",
                   (name, price, description, image_url))
    conn.commit()
    new_product_id = cursor.lastrowid
    conn.close()
    return jsonify({"message": "Producto agregado", "id": new_product_id, "imageUrl": image_url}), 201

# Actualizar un producto existente (solo admin)
@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    if not authenticate_admin():
        return jsonify({"message": "No autorizado"}), 403

    conn = get_db_connection()
    product = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    if not product:
        conn.close()
        return jsonify({"message": "Producto no encontrado"}), 404

    # Usamos request.form para obtener datos de FormData
    name = request.form.get('name', product['name'])
    price = request.form.get('price', product['price'])
    description = request.form.get('description', product['description'])
    image_file = request.files.get('image')
    delete_image_flag = request.form.get('delete_image_flag') == 'true' # Si se marca para eliminar la imagen actual

    current_image_url = product['imageUrl']
    new_image_url = current_image_url

    if delete_image_flag and current_image_url:
        # Eliminar la imagen antigua si se solicita
        old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(current_image_url))
        if os.path.exists(old_image_path):
            os.remove(old_image_path)
        new_image_url = None

    if image_file:
        # Si hay una nueva imagen, eliminar la antigua (si existe) y guardar la nueva
        if current_image_url:
            old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(current_image_url))
            if os.path.exists(old_image_path):
                os.remove(old_image_path)
        
        filename = str(uuid.uuid4()) + os.path.splitext(image_file.filename)[1]
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image_file.save(filepath)
        new_image_url = f'/uploads/{filename}'
    
    try:
        price = float(price)
    except ValueError:
        conn.close()
        return jsonify({"message": "El precio debe ser un número válido"}), 400

    cursor = conn.cursor()
    cursor.execute("UPDATE products SET name = ?, price = ?, description = ?, imageUrl = ? WHERE id = ?",
                   (name, price, description, new_image_url, product_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Producto actualizado", "imageUrl": new_image_url})

# Eliminar un producto (solo admin)
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    if not authenticate_admin():
        return jsonify({"message": "No autorizado"}), 403

    conn = get_db_connection()
    product = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    
    if product:
        # Eliminar la imagen asociada si existe
        if product['imageUrl']:
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(product['imageUrl']))
            if os.path.exists(image_path):
                os.remove(image_path)
        
        conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Producto eliminado"}), 200
    conn.close()
    return jsonify({"message": "Producto no encontrado"}), 404

# Servir imágenes estáticas desde la carpeta 'uploads'
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    # Ejecuta el script de inicialización de la base de datos al inicio
    # para asegurar que exista antes de que Flask intente conectarse.
    # No es necesario ejecutarlo siempre si ya existe, pero no causa problemas.
    from database import init_db
    init_db() 
    app.run(debug=True, port=5000) # Corre el servidor en el puerto 5000