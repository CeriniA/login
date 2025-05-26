document.getElementById('forgotPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    // Validar correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorMessage.textContent = 'Correo electrónico inválido';
        errorMessage.style.display = 'block';
        return;
    }
    
    // Mostrar mensaje de carga
    successMessage.textContent = 'Enviando código...';
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    
    try {
        const result = await fetch('http://localhost:3000/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email
            })
        });
        
        const data = await result.json();
        
        if (result.ok) {
            successMessage.textContent = 'Se ha enviado un código a tu correo';
            
            // Mostrar el código de verificación (solo para desarrollo)
            successMessage.textContent += ` (Código: ${data.verificationCode})`;
            
            // Agregar botón para verificar código
            const form = document.getElementById('forgotPasswordForm');
            form.innerHTML = `
                <div class="input-group">
                    <input type="text" id="code" required>
                    <label for="code">Código de Verificación</label>
                </div>
                <div class="input-group">
                    <input type="password" id="newPassword" required>
                    <label for="newPassword">Nueva Contraseña</label>
                </div>
                <button type="submit">Cambiar Contraseña</button>
                <div class="error-message" id="errorMessage"></div>
                <div class="success-message" id="successMessage"></div>
                <div class="links">
                    <a href="index.html">Volver al Login</a>
                </div>
            `;
            
            // Agregar evento para verificar código
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const code = document.getElementById('code').value;
                const newPassword = document.getElementById('newPassword').value;
                
                try {
                    const result = await fetch('http://localhost:3000/api/reset-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email,
                            code,
                            newPassword
                        })
                    });
                    
                    const data = await result.json();
                    
                    if (result.ok) {
                        successMessage.textContent = 'Contraseña cambiada exitosamente';
                        
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
