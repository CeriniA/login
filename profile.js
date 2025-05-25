document.addEventListener('DOMContentLoaded', async function() {
    // Verificar si hay token
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Mostrar información del usuario
    document.getElementById('email').textContent = `Correo: ${user.email}`;
    document.getElementById('createdAt').textContent = `Cuenta creada: ${new Date(user.createdAt).toLocaleDateString()}`;
    
    // Manejador de cierre de sesión
    document.getElementById('logout').addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
});
