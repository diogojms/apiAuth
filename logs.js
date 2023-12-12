var amqp = require('amqplib/callback_api');
const Log = require('./Models/log');

const queue = 'tasks';

// function SendToLog(message){
//     amqp.connect(`amqp://${process.env.LOGS_URI}`, function(error0, connection) {
//         if (error0) {
//             throw error0;
//         }
//         connection.createChannel(function(error1, channel) {
//             if (error1) {
//                 throw error1;
//             }

//             channel.assertQueue(queue, {
//                 durable: true
//             });
//             channel.sendToQueue(queue, Buffer.from(JSON.stringify(message).toString()));
//         });

//         setTimeout(function() {
//             connection.close();
//         }, 500);
//     });
// }

const sendToRabbitMQ = (message) => {
  console.log('LOGS_URI:', process.env.LOGS_URI);
    amqp.connect(`amqp://${process.env.LOGS_URI}`, function (error0, connection) {
      if (error0) {
        throw error0;
      }
      connection.createChannel(function (error1, channel) {
        if (error1) {
          throw error1;
        }
  
        channel.assertQueue(queue, {
          durable: true,
        });
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message).toString()));
      });
  
      setTimeout(function () {
        connection.close();
      }, 500);
    });
  };
  
  const sendToMongoDB = async (message) => {
    try {
        const logData = {
            level: message.Level,
            action: message.Action,
            description: message.Description,
            user: message.User,
          };
      
          // Usar o modelo Log para salvar no MongoDB
          const log = new Log(logData);
          await log.save();
    } catch (error) {
      console.error('Error saving log to MongoDB:', error);
    }
  };
  

  function SendToLog(message) {
    // Lógica para enviar mensagem para o RabbitMQ
    sendToRabbitMQ(message);
    // Lógica para enviar mensagem para o MongoDB
    sendToMongoDB(message);
  }

module.exports = { SendToLog };