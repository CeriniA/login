const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(__dirname));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Configurar base de datos
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Ruta para registrar nuevo usuario
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validar correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Correo electrónico inválido' });
        }

        // Verificar si el usuario ya existe
        const user = await new Promise((resolve) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                resolve(row);
            });
        });

        if (user) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario
        const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
        stmt.run(email, hashedPassword, function(err) {
            if (err) {
                res.status(500).json({ error: 'Error al registrar usuario' });
            } else {
                res.status(201).json({ message: 'Usuario registrado exitosamente' });
            }
            stmt.finalize();
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta para login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verificar si el usuario existe
        const user = await new Promise((resolve) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                resolve(row);
            });
        });

        if (!user) {
            return res.status(400).json({ error: 'Correo o contraseña incorrectos' });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Correo o contraseña incorrectos' });
        }

        // Crear token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta para solicitar reseteo de contraseña
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Verificar si el usuario existe
        const user = await new Promise((resolve) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                resolve(row);
            });
        });

        if (!user) {
            return res.status(400).json({ error: 'No existe un usuario con ese correo' });
        }

        // Generar código de verificación (por ejemplo, 6 dígitos)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Aquí deberías enviar el código por correo electrónico
        // Por ahora, simplemente lo almacenamos en la base de datos
        const stmt = db.prepare('INSERT OR REPLACE INTO password_reset (email, code, expires_at) VALUES (?, ?, ?)');
        stmt.run(email, verificationCode, new Date(Date.now() + 30 * 60 * 1000).toISOString()); // Código válido por 30 minutos
        stmt.finalize();

        // Devolver el código (solo para desarrollo)
        res.json({
            message: 'Se ha enviado un código a tu correo',
            verificationCode: verificationCode  // Solo para desarrollo
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta para resetear contraseña
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        // Verificar código de verificación
        const reset = await new Promise((resolve) => {
            db.get('SELECT * FROM password_reset WHERE email = ? AND code = ?', [email, code], (err, row) => {
                resolve(row);
            });
        });

        if (!reset) {
            return res.status(400).json({ error: 'Código de verificación inválido' });
        }

        // Verificar si el código ha expirado
        if (new Date(reset.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Código de verificación ha expirado' });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña del usuario
        const stmt = db.prepare('UPDATE users SET password = ? WHERE email = ?');
        stmt.run(hashedPassword, email);
        stmt.finalize();

        // Eliminar el código de reseteo usado
        db.run('DELETE FROM password_reset WHERE email = ?', [email]);

        res.json({
            message: 'Contraseña cambiada exitosamente'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear tabla para almacenar códigos de reseteo
const createPasswordResetTable = () => {
    db.run(`
        CREATE TABLE IF NOT EXISTS password_reset (
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            PRIMARY KEY (email)
        )
    `);
};

// Crear tabla de usuarios y tabla de reseteo
const createTables = () => {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        createPasswordResetTable();
    });
};

createTables();

// Ruta protegida (ejemplo)
app.get('/api/profile', verifyToken, (req, res) => {
    res.json({
        user: req.user
    });
});

// Middleware para verificar token
function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
