let token = localStorage.getItem('token');

// Función para hacer peticiones con token
async function makeRequest(url, method, data = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Error en la comunicación con el servidor' };
    }
}

// Manejador de login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    // Mostrar mensaje de carga
    successMessage.textContent = 'Iniciando sesión...';
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    
    try {
        const result = await makeRequest('http://localhost:3000/api/login', 'POST', {
            email,
            password
        });
        
        if (result.token) {
            // Guardar token en localStorage
            token = result.token;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(result.user));
            
            successMessage.textContent = 'Login exitoso';
            
            // Redirigir al perfil después de 2 segundos
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 2000);
        } else {
            errorMessage.textContent = result.error || 'Error desconocido';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        }
    } catch (error) {
        errorMessage.textContent = 'Error en la comunicación con el servidor';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }
});

// Manejador de registro
document.getElementById('register').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'register.html';
});

// Manejador de recuperación de contraseña
document.getElementById('forgotPassword').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'forgot-password.html';
});
