const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2'); 
const bcrypt = require('bcrypt');
const path = require('path');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;

const accountSid = 'AC44561615b6c3edb73c5f7d4aeaaa9588'; // Tu Account SID
const authToken = 'a8ae67c8d8a846148270bfd7e9e3f262'; // Tu Auth Token
const twilioClient = twilio(accountSid, authToken); // Inicialización del cliente



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'luisfn.martinez@gmail.com', // Tu correo de Gmail
        pass: 'zohj srsh shzr yjje' // Contraseña de aplicación si 2FA está habilitada
    }
});


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'front-end')));

// Configurar la conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '', 
  database: 'proyecto_sms' 
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
      console.error('Error conectando a la base de datos: ' + err.stack);
      return;
    }
    console.log('Conectado a la base de datos como id ' + connection.threadId);
  });

// Función para enviar un SMS con Twilio
function enviarSMS(mensaje, numero) {
    twilioClient.messages.create({
      body: mensaje,
      from: '+16262437138', // Tu número de Twilio
      to: numero // Número de destino
    })
    .then(message => console.log(`SMS enviado: ${message.sid}`))
    .catch(error => console.error(`Error al enviar SMS: ${error.message}`));
  }
  
  
// Función para enviar un correo electrónico con Nodemailer
const enviarCorreo = (destinatario, asunto, texto) => {
    const mailOptions = {
        from: 'luisfn.martinez@gmail.com',
        to: destinatario,
        subject: asunto,
        text: texto
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error al enviar el correo: ', error);
        } else {
            console.log('Correo enviado: ' + info.response);
        }
    });
};



// Ruta para obtener todas las campañas
app.get('/api/campanas', (req, res) => {
  connection.query('SELECT * FROM campanas', (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al obtener las campañas' });
    }
    res.json(results);
  });
});

// Ruta para crear una nueva campaña con envío de notificaciones
app.post('/api/campanas', (req, res) => {
  const nuevaCampana = req.body;
  
  connection.query('INSERT INTO campanas SET ?', nuevaCampana, (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al crear la campaña' });
    }

    const mensaje = `Nueva campaña creada: ${nuevaCampana.nombre}. Mensaje: ${nuevaCampana.mensaje}`;
    
    // Enviar SMS
    enviarSMS(mensaje, '+56927325182'); 

    // Enviar correo
    enviarCorreo(mensaje, '');

    res.status(201).json({ message: 'Campaña creada', id: results.insertId });
  });
});

// Ruta para actualizar una campaña con envío de notificaciones
app.put('/api/campanas/:id', (req, res) => {
  const { id } = req.params;
  const actualizadaCampana = req.body;
  
  connection.query('UPDATE campanas SET ? WHERE id = ?', [actualizadaCampana, id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al actualizar la campaña' });
    }

    const mensaje = `La campaña con ID ${id} ha sido actualizada. Nuevos detalles: ${actualizadaCampana.mensaje}`;
    
    // Enviar SMS
    enviarSMS(mensaje, '+56947725774'); 

    // Enviar correo
    enviarCorreo(mensaje, 'nicolascarmonarioseco@gmail.com'); 

    res.json({ message: 'Campaña actualizada' });
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor en funcionamiento en http://localhost:${PORT}`);
});

// Ruta para probar el envío de SMS
app.get('/api/prueba-sms', (req, res) => {
    const mensaje = "Este es un mensaje de prueba.";
    const numeroDestino = '+56947725774'; // Reemplaza con el número al que deseas enviar el SMS
  
    enviarSMS(mensaje, numeroDestino);
    
    res.json({ message: 'Mensaje de prueba enviado' });
});

app.get('/api/enviar-correo', (req, res) => {
    const destinatario = 'nicolascarmonarioseco@gmail.com'; // Cambia esto por el email del destinatario
    const asunto = 'Asunto del correo';
    const texto = 'Este es el contenido del correo.';

    enviarCorreo(destinatario, asunto, texto);
    res.send('Correo enviado (o en proceso)');
});

app.post('/api/enviar-correo', (req, res) => {
    const destinatario = 'nicolascarmonarioseco@gmail.com';
    const asunto = 'Nueva campaña creada';
    const mensaje = 'Este es el contenido del mensaje.';

    // Llama a la función para enviar el correo
    enviarCorreo(destinatario, asunto, mensaje, (error, info) => {
        if (error) {
            // Manejo de error: respuesta al cliente
            return res.status(500).json({ error: 'Error al enviar el correo' });
        }
        // Si se envía con éxito
        res.status(201).json({ message: 'Campaña creada', id: results.insertId });
    });
});

