const { Server } = require("http");
const User = require("../Models/user");
const { checkToken } = require("../utils");

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
        Level: 'Info', Action: `/user/${id}`,
        Description: user, User: await getIdFromToken(req) }
    SendToLog(dataToLog)

    res.status(200).json(user)
  }
  ]
   
};

module.exports = userController;
