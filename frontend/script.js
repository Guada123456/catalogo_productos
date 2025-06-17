// Configuración de la API del Backend
const API_BASE_URL = 'https://catalogo-productos.onrender.com/api'; // Dirección de tu backend Flask
const UPLOADS_BASE_URL = 'https://catalogo-productos.onrender.com'; // Necesario para imágenes locales

let adminAuthToken = localStorage.getItem('adminAuthToken') || "guada123";

// Variables globales
let allProducts = [];
const whatsappNumber = "5493525516070";
const placeholderImage = 'https://via.placeholder.com/150x150?text=No+Image';

// --- Elementos del DOM (Mantener lo último que te pasé con el botón al final) ---
const adminPanel = document.getElementById("admin-panel");
const loginForm = document.getElementById("login-form");
const showLoginBtn = document.getElementById("show-login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginErrorMessage = document.getElementById("login-error-message");
const productsContainer = document.getElementById("products-container");
const searchInput = document.getElementById("search-input");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

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

function checkAdminStatus() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';

    if (isLoggedIn) {
        adminPanel.style.display = "block";
        if (showLoginBtn) showLoginBtn.style.display = "none";
        if (loginForm) loginForm.style.display = "none";
    } else {
        adminPanel.style.display = "none";
        if (showLoginBtn) showLoginBtn.style.display = "block";
    }
    displayProducts(allProducts);
}

window.toggleLoginForm = () => {
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        usernameInput.value = '';
        passwordInput.value = '';
        loginErrorMessage.style.display = 'none';
        showLoginBtn.textContent = 'Ocultar Formulario';
    } else {
        loginForm.style.display = 'none';
        showLoginBtn.textContent = 'Iniciar Sesión Administrador';
    }
};

window.login = async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    loginErrorMessage.style.display = "none";

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
            adminAuthToken = data.token;
            localStorage.setItem('adminAuthToken', adminAuthToken);
            localStorage.setItem('adminLoggedIn', 'true');
            alert("Sesión iniciada correctamente.");
            checkAdminStatus();
        } else {
            loginErrorMessage.textContent = data.message || "Error al iniciar sesión. Credenciales inválidas.";
            loginErrorMessage.style.display = "block";
        }
    } catch (error) {
        loginErrorMessage.textContent = "Error de conexión al servidor al intentar iniciar sesión.";
        loginErrorMessage.style.display = "block";
        console.error("Error al iniciar sesión:", error);
    }
};

window.logout = () => {
    adminAuthToken = '';
    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('adminLoggedIn');
    alert("Sesión cerrada.");
    checkAdminStatus();
};


// --- LÓGICA DE PRODUCTOS (CARGA Y BÚSQUEDA PARA CLIENTES) ---

async function fetchProducts() {
    productsContainer.innerHTML = '<p style="text-align: center; width: 100%;">Cargando productos...</p>';
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const productsData = await response.json();
        allProducts = productsData.sort((a, b) => a.name.localeCompare(b.name));
        displayProducts(allProducts);
    } catch (error) {
        productsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Error al cargar productos. Asegúrate de que el backend esté funcionando.</p>';
        console.error("Error al cargar productos:", error);
    }
}

function displayProducts(productsToDisplay) {
    productsContainer.innerHTML = '';

    if (productsToDisplay.length === 0) {
        productsContainer.innerHTML = '<p style="text-align: center; width: 100%;">No se encontraron productos.</p>';
        return;
    }

    const isAdminLoggedInNow = localStorage.getItem('adminLoggedIn') === 'true';

    productsToDisplay.forEach(product => {
        const productDiv = document.createElement("div");
        productDiv.className = "product-card";
        // Esta línea es CRÍTICA para que las imágenes locales se muestren
        const imageUrl = product.image_url ? `${UPLOADS_BASE_URL}/uploads/${product.image_url}` : placeholderImage;
        const formattedPrice = product.price ? parseFloat(product.price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A';

        productDiv.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">Precio: $${formattedPrice}</p>
            ${product.description ? `<p style="font-size:0.9em; color:#777;">${product.description}</p>` : ''}
            <button class="whatsapp-btn" onclick="consultarWhatsApp('${product.name}', ${product.price})">Consultar por WhatsApp</button>
            
            ${isAdminLoggedInNow ? `
            <div class="admin-actions">
                <button class="edit-btn" onclick="editProduct(${product.id})">Editar</button>
                <button class="delete-btn" onclick="deleteProduct(${product.id})">Eliminar</button>
            </div>
            ` : ''}
        `;
        productsContainer.appendChild(productDiv);
    });
}

function consultarWhatsApp(productName, productPrice) {
    const message = `¡Hola! Me gustaría consultar sobre el producto "${productName}" que tiene un precio de $${parseFloat(productPrice).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.%0A%0A¡Espero tu respuesta!`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}


window.searchProducts = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
    );
    displayProducts(filteredProducts);
};


// --- LÓGICA DE ADMINISTRACIÓN (CRUD DE PRODUCTOS) ---

window.openProductModal = async (productId = null) => {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        alert("Debes iniciar sesión como administrador para realizar esta acción.");
        return;
    }

    productForm.reset();
    productIdInput.value = '';
    currentImagePreview.style.display = 'none';
    currentImagePreview.src = '';
    uploadStatus.textContent = '';
    deleteCurrentImageCheckbox.checked = false;

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
            // Esta línea es CRÍTICA para que las imágenes locales se muestren
            if (product.image_url) {
                currentImagePreview.src = `${UPLOADS_BASE_URL}/uploads/${product.image_url}`;
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

window.closeProductModal = () => {
    productFormModal.style.display = "none";
    modalOverlay.style.display = "none";
    productForm.reset();
};

productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (localStorage.getItem('adminLoggedIn') !== 'true' || !adminAuthToken) {
        alert("No tienes permisos de administrador o tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
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
    formData.append('delete_image', deleteCurrentImage ? 'true' : 'false');

    uploadStatus.textContent = 'Guardando producto...';
    uploadStatus.style.color = 'blue';

    try {
        let response;
        if (id) {
            response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                },
                body: formData
            });
        } else {
            response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                },
                body: formData
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el producto');
        }

        uploadStatus.textContent = 'Producto guardado exitosamente!';
        uploadStatus.style.color = 'green';
        setTimeout(() => {
            closeProductModal();
            fetchProducts();
        }, 1000);
    } catch (error) {
        uploadStatus.textContent = `Error al guardar el producto: ${error.message}`;
        uploadStatus.style.color = 'red';
        console.error("Error al guardar producto:", error);
        alert("Error al guardar el producto: " + error.message);
    }
});

window.editProduct = (productId) => {
    openProductModal(productId);
};

window.deleteProduct = async (productId) => {
    if (localStorage.getItem('adminLoggedIn') !== 'true' || !adminAuthToken) {
        alert("No tienes permisos de administrador o tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        return;
    }

    if (!confirm("¿Estás seguro de que quieres eliminar este producto? Esta acción es irreversible.")) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminAuthToken}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar el producto');
        }

        alert("Producto eliminado exitosamente.");
        fetchProducts();
    } catch (error) {
        alert("Error al eliminar el producto: " + error.message);
        console.error("Error al eliminar producto:", error);
    }
};

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
        if (!productIdInput.value || deleteCurrentImageCheckbox.checked) {
             currentImagePreview.src = '';
             currentImagePreview.style.display = 'none';
        }
    }
});

deleteCurrentImageCheckbox.addEventListener('change', () => {
    if (deleteCurrentImageCheckbox.checked) {
        currentImagePreview.style.display = 'none';
        productImageInput.value = '';
    } else if (productIdInput.value && currentImagePreview.src && currentImagePreview.src !== placeholderImage) {
        currentImagePreview.style.display = 'block';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    checkAdminStatus();

    window.onclick = function(event) {
        if (event.target == modalOverlay) {
            closeProductModal();
        }
    };
});