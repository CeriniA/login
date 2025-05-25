document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    // Validaciones del formulario
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Las contraseñas no coinciden';
        errorMessage.style.display = 'block';
        return;
    }
    
    // Mostrar mensaje de carga
    successMessage.textContent = 'Registrando...';
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    
    try {
        const result = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        
        const data = await result.json();
        
        if (result.ok) {
            successMessage.textContent = 'Registro exitoso';
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            errorMessage.textContent = data.error || 'Error desconocido';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        }
    } catch (error) {
        errorMessage.textContent = 'Error en la comunicación con el servidor';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }
});
