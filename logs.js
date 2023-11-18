var amqp = require('amqplib/callback_api');

const queue = 'tasks';

function SendToLog(message){
    amqp.connect(`amqp://${process.env.LOGS_URI}`, function(error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }

            channel.assertQueue(queue, {
                durable: true
            });
            channel.sendToQueue(queue, Buffer.from(JSON.stringify(message).toString()));
        });

        setTimeout(function() {
            connection.close();
        }, 500);
    });
}

module.exports = { SendToLog };