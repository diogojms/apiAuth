const { Server } = require("http");
const User = require("../Models/user");
const { SendToLog } = require('../logs');
const { checkToken } = require("../utils");
const { getIdFromToken } = require("../utils");

const userController = {
  getUserById: [
    checkToken,
    async (req, res) => {
    const id = req.params.id
    let dataToLog

    const user = await User.findById(id, '-_id')

    if(!user){
        dataToLog = {
            Level: 'Error', Action: `/user/${id}`,
            Description: user, User: await getIdFromToken(req) }
        SendToLog(dataToLog)

        return res.status(422).json({msg: "Utilizador não encontrado"})
    }

    dataToLog = {
        Level: 'Info', Action: `/user/getUser/${id}`,
        Description: user, User: await getIdFromToken(req) }
    SendToLog(dataToLog)

    res.status(200).json(user)
  }
  ],

  changeInfo :[checkToken,async (req, res) => {
    try {
      const { newNIF, newName, newEmail } = req.body;
      console.log('Dados recebidos:', { newNIF, newName, newEmail });

      const userId = await getIdFromToken(req);
      const user = await User.findById(userId);

      console.log (userId);
      console.log (user);
  
      if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado' });
      }
  
      // Verifique a revogação do token
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(" ")[1];

      console.log('Token:', token);
  
      // if (revokedTokens.includes(token)) {
      //   const logData = {
      //     Level: 'Error',
      //     Action: '/users/change-nif',
      //     Description: 'Revoked token used',
      //     User: userId
      //   };
      //   SendToLog(logData);
      //   return res.status(401).json({ msg: "Token revogado utilizado" });
      // } 
        // Atualize as informações do usuário
        if (newNIF) user.nif = newNIF;
        if (newName) user.name = newName;
        if (newEmail) user.email = newEmail;

        console.log('Novas informações do usuário:', user);

        // Salve as alterações no banco de dados
        await user.save();

        console.log('Informações salvas com sucesso no banco de dados:', user);
  
        const logData = {
          Level: 'Info',
          Action: '/users/changeInfo',
          Description: `Informações alteradas com sucesso para o usuário com ID: ${userId}`,
          User: userId
        };
  
        SendToLog(logData);
  
        return res.status(200).json({ msg: 'Informações alteradas com sucesso' });
    } catch (err) {
      const logData = {
        Level: 'Error',
        Action: '/users/changeInfo',
        Description: err.message,
        User: "Error"
      };
  
      SendToLog(logData);
  
      return res.status(500).json({ msg: 'Erro interno do servidor' });
    }
  },
  ]
};


module.exports = userController;
