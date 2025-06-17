const API_BASE_URL = 'https://catalogo-productos.onrender.com/api'; // Dirección de tu backend Flask

const UPLOADS_BASE_URL = 'https://catalogo-productos.onrender.com'; // Dirección para acceder a las imágenes



// ¡ATENCIÓN! ESTE TOKEN DEBE COINCIDIR CON EL DE TU BACKEND (ADMIN_AUTH_TOKEN en app.py)

// En una aplicación real, este token se obtendría del servidor tras el login.

const ADMIN_AUTH_TOKEN = "guada123"; 



// Variables globales

let allProducts = [];

let isAdminLoggedIn = false; // Estado de login del admin

const whatsappNumber = "5493525516070"; // Reemplaza con tu número de WhatsApp (ej: 5493543XXXXXXX para Argentina)

const placeholderImage = 'https://via.placeholder.com/150x150?text=No+Image';



// --- Elementos del DOM ---

const adminPanel = document.getElementById("admin-panel");

const loginForm = document.getElementById("login-form");

const logoutBtn = document.getElementById("logout-btn");

const loginErrorMessage = document.getElementById("login-error-message");

const productsContainer = document.getElementById("products-container");

const searchInput = document.getElementById("search-input");



// Modal de producto

const productFormModal = document.getElementById("product-form-modal");

const modalOverlay = document.getElementById("modal-overlay");

const modalTitle = document.getElementById("modal-title");

const productForm = document.getElementById("product-form");

const productIdInput = document.getElementById("product-id");

const productNameInput = document.getElementById("product-name");

const productPriceInput = document.getElementById("product-price");

const productDescriptionInput = document.getElementById("product-description");

const productImageInput = document.getElementById("product-image");

const currentImagePreview = document.getElementById("current-image-preview");

const deleteCurrentImageCheckbox = document.getElementById("delete-current-image");

const uploadStatus = document.getElementById("upload-status");



// --- LÓGICA DE AUTENTICACIÓN Y VISIBILIDAD DE PANELES ---



// Verificar el estado de login al cargar la página

document.addEventListener('DOMContentLoaded', () => {

    // Intentar obtener el token de localStorage (simula una sesión)

    const storedToken = localStorage.getItem('adminToken');

    if (storedToken === ADMIN_AUTH_TOKEN) { // Validar que sea el token correcto

        isAdminLoggedIn = true;

        updateUIForAdminStatus();

    } else {

        isAdminLoggedIn = false;

        updateUIForAdminStatus();

    }

    fetchProducts(); // Cargar productos al iniciar

});



function updateUIForAdminStatus() {

    if (isAdminLoggedIn) {

        adminPanel.style.display = "block";

        loginForm.style.display = "none";

        logoutBtn.style.display = "inline-block";

        loginErrorMessage.style.display = "none";

    } else {

        adminPanel.style.display = "none";

        loginForm.style.display = "block";

        logoutBtn.style.display = "none";

    }

    displayProducts(allProducts); // Vuelve a renderizar para mostrar/ocultar botones de admin

}



// Función para iniciar sesión

window.login = async () => {

    const username = document.getElementById("username").value;

    const password = document.getElementById("password").value;

    loginErrorMessage.style.display = "none"; // Reset error message



    try {

        const response = await fetch(`${API_BASE_URL}/login`, {

            method: 'POST',

            headers: {

                'Content-Type': 'application/json'

            },

            body: JSON.stringify({ username, password })

        });



        const data = await response.json();



        if (response.ok) {

            localStorage.setItem('adminToken', data.token); // Guardar token para simular sesión

            isAdminLoggedIn = true;

            alert("Sesión iniciada correctamente.");

            updateUIForAdminStatus();

        } else {

            loginErrorMessage.textContent = data.message || "Error al iniciar sesión.";

            loginErrorMessage.style.display = "block";

        }

    } catch (error) {

        loginErrorMessage.textContent = "Error de conexión al servidor.";

        loginErrorMessage.style.display = "block";

        console.error("Error al iniciar sesión:", error);

    }

};



// Función para cerrar sesión

window.logout = () => {

    localStorage.removeItem('adminToken'); // Eliminar token de localStorage

    isAdminLoggedIn = false;

    alert("Sesión cerrada.");

    updateUIForAdminStatus();

};





// --- LÓGICA DE PRODUCTOS (CARGA Y BÚSQUEDA PARA CLIENTES) ---



// Función para obtener productos del backend

async function fetchProducts() {

    try {

        const response = await fetch(`${API_BASE_URL}/products`);

        if (!response.ok) {

            throw new Error(`HTTP error! status: ${response.status}`);

        }

        const productsData = await response.json();

        allProducts = productsData.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabéticamente

        displayProducts(allProducts);

    } catch (error) {

        productsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Error al cargar productos. Asegúrate de que el backend esté funcionando.</p>';

        console.error("Error al cargar productos:", error);

    }

}



// Función para mostrar productos en el DOM

function displayProducts(productsToDisplay) {

    productsContainer.innerHTML = ''; // Limpiar productos existentes



    if (productsToDisplay.length === 0) {

        productsContainer.innerHTML = '<p style="text-align: center; width: 100%;">No se encontraron productos.</p>';

        return;

    }



    productsToDisplay.forEach(product => {

        const productDiv = document.createElement("div");

        productDiv.className = "product-card";

        const imageUrl = product.imageUrl ? `${UPLOADS_BASE_URL}${product.imageUrl}` : placeholderImage;

        const formattedPrice = product.price ? product.price.toFixed(2).replace('.', ',') : 'N/A';



        productDiv.innerHTML = `

            <img src="${imageUrl}" alt="${product.name}">

            <h4>${product.name}</h4>

            <p>Precio: $${formattedPrice}</p>

            ${product.description ? `<p style="font-size:0.9em; color:#777;">${product.description}</p>` : ''}

            <a href="https://wa.me/${whatsappNumber}?text=Hola!%20Estoy%20interesado/a%20en%20el%20producto:%20*${encodeURIComponent(product.name)}*%20con%20precio%20$${formattedPrice}.%0A%0A¡Espero tu respuesta!" target="_blank" class="whatsapp-btn">Consultar por WhatsApp</a>

            

            ${isAdminLoggedIn ? `

            <div class="admin-controls">

                <button class="edit-btn" onclick="editProduct(${product.id})">Editar</button>

                <button class="delete-btn" onclick="deleteProduct(${product.id}, '${product.imageUrl || ''}')">Eliminar</button>

            </div>

            ` : ''}

        `;

        productsContainer.appendChild(productDiv);

    });

}



// Función de búsqueda de productos

window.searchProducts = () => {

    const searchTerm = searchInput.value.toLowerCase();

    const filteredProducts = allProducts.filter(product =>

        product.name.toLowerCase().includes(searchTerm) ||

        (product.description && product.description.toLowerCase().includes(searchTerm))

    );

    displayProducts(filteredProducts);

};





// --- LÓGICA DE ADMINISTRACIÓN (CRUD DE PRODUCTOS) ---



// Abrir el modal de producto (para agregar o editar)

window.openProductModal = async (productId = null) => {

    productForm.reset(); // Limpiar el formulario

    productIdInput.value = ''; // Resetear ID

    currentImagePreview.style.display = 'none'; // Ocultar previsualización de imagen

    currentImagePreview.src = '';

    uploadStatus.textContent = ''; // Limpiar estado de subida

    deleteCurrentImageCheckbox.checked = false; // Desmarcar checkbox de eliminar imagen



    if (productId) {

        modalTitle.textContent = "Editar Producto";

        productIdInput.value = productId;

        try {

            const response = await fetch(`${API_BASE_URL}/products/${productId}`);

            if (!response.ok) throw new Error('Error al cargar producto para editar');

            const product = await response.json();



            productNameInput.value = product.name;

            productPriceInput.value = product.price;

            productDescriptionInput.value = product.description || '';

            if (product.imageUrl) {

                currentImagePreview.src = `${UPLOADS_BASE_URL}${product.imageUrl}`;

                currentImagePreview.style.display = 'block';

            }

        } catch (error) {

            alert("Error al cargar datos del producto para edición.");

            console.error("Error al cargar producto para editar:", error);

            closeProductModal();

            return;

        }

    } else {

        modalTitle.textContent = "Agregar Nuevo Producto";

    }

    productFormModal.style.display = "block";

    modalOverlay.style.display = "block";

};



// Cerrar el modal de producto

window.closeProductModal = () => {

    productFormModal.style.display = "none";

    modalOverlay.style.display = "none";

    productForm.reset(); // Limpiar el formulario al cerrar

};



// Manejar el envío del formulario de producto (agregar/editar)

productForm.addEventListener("submit", async (e) => {

    e.preventDefault();



    if (!isAdminLoggedIn) {

        alert("No tienes permisos de administrador.");

        return;

    }



    const id = productIdInput.value;

    const name = productNameInput.value;

    const price = parseFloat(productPriceInput.value);

    const description = productDescriptionInput.value;

    const imageFile = productImageInput.files[0];

    const deleteCurrentImage = deleteCurrentImageCheckbox.checked;



    if (!name || isNaN(price)) {

        alert("Por favor, introduce un nombre y un precio válidos.");

        return;

    }



    const formData = new FormData();

    formData.append('name', name);

    formData.append('price', price);

    formData.append('description', description);

    if (imageFile) {

        formData.append('image', imageFile);

    }

    formData.append('delete_image_flag', deleteCurrentImage); // Enviar flag si la imagen actual debe borrarse



    uploadStatus.textContent = 'Guardando producto...';



    try {

        let response;

        if (id) {

            // Editar producto existente

            response = await fetch(`${API_BASE_URL}/products/${id}`, {

                method: 'PUT',

                headers: {

                    'Authorization': `Bearer ${ADMIN_AUTH_TOKEN}` // Enviar token de autenticación

                },

                body: formData // FormData se envía directamente sin 'Content-Type'

            });

        } else {

            // Agregar nuevo producto

            response = await fetch(`${API_BASE_URL}/products`, {

                method: 'POST',

                headers: {

                    'Authorization': `Bearer ${ADMIN_AUTH_TOKEN}` // Enviar token de autenticación

                },

                body: formData

            });

        }



        if (!response.ok) {

            const errorData = await response.json();

            throw new Error(errorData.message || 'Error al guardar el producto');

        }



        alert("Producto guardado exitosamente!");

        closeProductModal();

        fetchProducts(); // Recargar productos para actualizar la lista

    } catch (error) {

        uploadStatus.textContent = 'Error al guardar el producto.';

        alert("Error al guardar el producto: " + error.message);

        console.error("Error al guardar producto:", error);

    }

});



// Función para editar un producto (llamada desde el botón de cada tarjeta)

window.editProduct = (productId) => {

    openProductModal(productId);

};



// Función para eliminar un producto (llamada desde el botón de cada tarjeta)

window.deleteProduct = async (productId) => {

    if (!isAdminLoggedIn) {

        alert("No tienes permisos de administrador.");

        return;

    }



    if (!confirm("¿Estás seguro de que quieres eliminar este producto? Esta acción es irreversible.")) {

        return;

    }



    try {

        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {

            method: 'DELETE',

            headers: {

                'Authorization': `Bearer ${ADMIN_AUTH_TOKEN}` // Enviar token

            }

        });



        if (!response.ok) {

            const errorData = await response.json();

            throw new Error(errorData.message || 'Error al eliminar el producto');

        }



        alert("Producto eliminado exitosamente.");

        fetchProducts(); // Recargar productos

    } catch (error) {

        alert("Error al eliminar el producto: " + error.message);

        console.error("Error al eliminar producto:", error);

    }

};



// Vista previa de la imagen seleccionada en el formulario del modal

productImageInput.addEventListener('change', (event) => {

    const file = event.target.files[0];

    if (file) {

        const reader = new FileReader();

        reader.onload = (e) => {

            currentImagePreview.src = e.target.result;

            currentImagePreview.style.display = 'block';

        };

        reader.readAsDataURL(file);

    } else {

        // Si no se selecciona ningún archivo, ocultar la vista previa

        // Pero mantener la imagen si estamos en modo edición y no se eliminó

        if (!productIdInput.value || deleteCurrentImageCheckbox.checked) {

             currentImagePreview.src = '';

             currentImagePreview.style.display = 'none';

        }

    }

});



// Cuando el checkbox de eliminar imagen actual cambia, ajustar la visibilidad de la vista previa

deleteCurrentImageCheckbox.addEventListener('change', () => {

    if (deleteCurrentImageCheckbox.checked) {

        currentImagePreview.style.display = 'none';

        productImageInput.value = ''; // Limpiar el input de archivo si se va a eliminar la imagen actual

    } else if (productIdInput.value && currentImagePreview.src !== placeholderImage && currentImagePreview.src !== '') {

        // Si hay un producto editándose y tenía imagen, mostrarla de nuevo

        currentImagePreview.style.display = 'block';

    }

});