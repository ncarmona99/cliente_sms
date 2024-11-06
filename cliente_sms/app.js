const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const accountSid = 'AC44561615b6c3edb73c5f7d4aeaaa9588'; // Tu Account SID
const authToken = 'f6db3892330b7d7c4bab80192ca1c23f'; // Tu Auth Token
const twilioClient = twilio(accountSid, authToken); // Inicialización del cliente

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'luisfn.martinez@gmail.com', // Tu correo de Gmail
        pass: 'zohj srsh shzr yjje' // Contraseña de aplicación
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'front-end')));

// Configuración de la base de datos
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

function enviarSMS(mensaje, numero) {
  twilioClient.messages.create({
    body: mensaje,
    from: '+16262437138',
    to: numero
  })
  .then(message => console.log(`SMS enviado: ${message.sid}`))
  .catch(error => console.error(`Error al enviar SMS: ${error.message}`));
}

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

// Ruta para probar el envío de SMS
app.get('/api/prueba-sms', (req, res) => {
    const mensaje = "Este es un mensaje de prueba.";
    const numeroDestino = '+56927325182';
  
    enviarSMS(mensaje, numeroDestino);
    
    res.json({ message: 'Mensaje de prueba enviado' });
});

// Ruta para probar el envío de correo
app.get('/api/enviar-correo', (req, res) => {
    const destinatario = 'luisfn.martinez@gmail.com';
    const asunto = 'Asunto del correo';
    const texto = 'Este es el contenido del correo.';

    enviarCorreo(destinatario, asunto, texto);
    res.send('Correo enviado (o en proceso)');
});

// Rutas de API
app.get('/api/campanas', (req, res) => {
  connection.query('SELECT * FROM campana', (error, results) => {
      if (error) {
          console.error('Error al obtener las campañas:', error.message);
          return res.status(500).json({ error: 'Error al obtener las campañas', detalle: error.message });
      }
      res.json(results);
  });
});

app.post('/api/campanas', (req, res) => {
  // Obtener los datos del cuerpo de la solicitud (POST)
  const { idusuario, idestadocampana, idcorreo, fechaenvio } = req.body;

  // Agregar mensajes de depuración para ver si se están recibiendo los datos correctamente
  console.log('Datos recibidos:', req.body);

  // Validación de los datos para asegurarse de que no falten valores
  if (!idusuario) {
    console.log('Falta el campo idusuario');
    return res.status(400).json({
      error: 'Falta el campo idusuario'
    });
  }

  if (!idestadocampana) {
    console.log('Falta el campo idestadocampana');
    return res.status(400).json({
      error: 'Falta el campo idestadocampana'
    });
  }

  if (!idcorreo) {
    console.log('Falta el campo idcorreo');
    return res.status(400).json({
      error: 'Falta el campo idcorreo'
    });
  }

  if (!fechaenvio) {
    console.log('Falta el campo fechaenvio');
    return res.status(400).json({
      error: 'Falta el campo fechaenvio'
    });
  }

  // Crear la consulta SQL para insertar los datos en la tabla
  const query = 'INSERT INTO campana (idusuario, idestadocampana, idcorreo, fechaenvio) VALUES (?, ?, ?, ?)';
  connection.query(query, [idusuario, idestadocampana, idcorreo, fechaenvio], (error, results) => {
    if (error) {
      console.error('Error al insertar la campaña:', error.message);
      return res.status(500).json({
        error: 'Error al insertar la campaña',
        detalle: error.message,
      });
    }

    // Responder con el ID de la campaña insertada y un mensaje de éxito
    res.status(201).json({
      message: 'Campaña insertada correctamente',
      campañaId: results.insertId,  // Aquí obtienes el ID de la campaña insertada
    });
  });
});

app.put('/api/campanas/:id', (req, res) => {
    const { id } = req.params;
    const actualizadaCampana = req.body;
    
    const horaEnvio = parseInt(actualizadaCampana.horaEnvio.split(":")[0], 10);
    if (horaEnvio < 8 || horaEnvio >= 22) {
        return res.status(400).json({ error: 'La hora de envío debe estar entre las 08:00 y las 22:00.' });
    }

    connection.query('UPDATE campana SET ? WHERE id = ?', [actualizadaCampana, id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error al actualizar la campaña' });
        }

        const mensaje = `La campaña con ID ${id} ha sido actualizada. Nuevos detalles: ${actualizadaCampana.mensaje}`;
        
        // Enviar SMS y Correo
        enviarSMS(mensaje, '+56947725774');
        enviarCorreo('nicolascarmonarioseco@gmail.com', 'Campaña actualizada', mensaje);

        res.json({ message: 'Campaña actualizada' });
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor en funcionamiento en http://localhost:${PORT}`);
});