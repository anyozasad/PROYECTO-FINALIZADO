const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

// Login - Acepta CUALQUIER usuario
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Determinar rol según email
    let rol_id = 3; // Cliente por defecto
    if (email === 'admin@gmail.com') {
      rol_id = 1; // Administrador
    }

    // Crear usuario si no existe
    let usuario = { id: Math.random(), email, password, rol_id, nombre: email };
    
    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id }, process.env.JWT_SECRET || 'partgo_secret_dev', {
      expiresIn: '24h'
    });

    res.json({ token, usuario });
  } catch (error) {
    next(error);
  }
};

// Register
const register = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    const usuario = {
      id: Math.random(),
      nombre,
      email,
      password,
      rol_id: 3
    };

    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id }, process.env.JWT_SECRET || 'partgo_secret_dev', {
      expiresIn: '24h'
    });

    res.json({ token, usuario });
  } catch (error) {
    next(error);
  }
};

// Me
const me = async (req, res, next) => {
  try {
    const usuario = { id: req.usuario.id, rol_id: req.usuario.rol_id };
    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

// Recuperar Password
const recuperarPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    res.json({ mensaje: 'Revisa tu email para recuperar tu contraseña' });
  } catch (error) {
    next(error);
  }
};

// Actualizar Perfil
const actualizarPerfil = async (req, res, next) => {
  try {
    const { nombre, documento, telefono, direccion } = req.body;
    const usuario = { id: req.usuario.id, nombre, documento, telefono, direccion };
    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

// Google Auth
const googleAuth = async (req, res, next) => {
  try {
    const { id, name, email, picture } = req.body;

    const usuario = {
      id: Math.random(),
      nombre: name || email.split('@')[0],
      email: email,
      rol_id: 3,
      picture_url: picture,
      provider: 'google',
      provider_id: id
    };

    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id }, process.env.JWT_SECRET || 'partgo_secret_dev', {
      expiresIn: '24h'
    });

    res.json({ token, usuario });
  } catch (error) {
    next(error);
  }
};

// Facebook Auth
const facebookAuth = async (req, res, next) => {
  try {
    const { id, name, email, picture } = req.body;

    const usuario = {
      id: Math.random(),
      nombre: name || email.split('@')[0],
      email: email,
      rol_id: 3,
      picture_url: picture,
      provider: 'facebook',
      provider_id: id
    };

    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id }, process.env.JWT_SECRET || 'partgo_secret_dev', {
      expiresIn: '24h'
    });

    res.json({ token, usuario });
  } catch (error) {
    next(error);
  }
};

// Google Callback
const googleCallback = async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Código requerido' });
    }

    const usuario = {
      id: Math.random(),
      nombre: 'Usuario Google',
      email: 'oauth@google.com',
      rol_id: 3
    };

    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id }, process.env.JWT_SECRET || 'partgo_secret_dev', {
      expiresIn: '24h'
    });

    res.json({ token, usuario });
  } catch (error) {
    next(error);
  }
};

// Facebook Callback
const facebookCallback = async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Código requerido' });
    }

    const usuario = {
      id: Math.random(),
      nombre: 'Usuario Facebook',
      email: 'oauth@facebook.com',
      rol_id: 3
    };

    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id }, process.env.JWT_SECRET || 'partgo_secret_dev', {
      expiresIn: '24h'
    });

    res.json({ token, usuario });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  me,
  recuperarPassword,
  actualizarPerfil,
  googleAuth,
  facebookAuth,
  googleCallback,
  facebookCallback
};
