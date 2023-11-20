const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Auth = require("../Models/auth");
const User = require("../Models/user");
const { SendToLog } = require('../logs');
const { checkToken } = require("../utils");



const tokenValidation = 60 * 60 * 6;

// ... outras importações e constantes ...

const authController = {
  register : async (req, res) => {
    const { email, name, nif, username, password, dubPassword } = req.body;
  
    // if (!email) {
    //   SendToLog({ Level: 'Error', Action: '/auth/register', Description: 'Email necessário', User: null });
    //   return res.status(422).json({ msg: "Email necessário" });
    // }

    // if (!name) {
    //   SendToLog({ Level: 'Error', Action: '/auth/register', Description: 'Nome necessário', User: null });
    //   return res.status(422).json({ msg: "Nome necessário" });
    // }
    
    // if (!username) {
    //   SendToLog({ Level: 'Error', Action: '/auth/register', Description: 'Username necessário', User: null });
    //   return res.status(422).json({ msg: "Username necessário" });
    // }
    
    // if (!password) {
    //   SendToLog({ Level: 'Error', Action: '/auth/register', Description: 'Password necessária', User: null });
    //   return res.status(422).json({ msg: "Password necessária" });
    // }
    
    // if (dubPassword != password) {
    //   SendToLog({ Level: 'Error', Action: '/auth/register', Description: 'Passwords não condizem', User: null });
    //   return res.status(422).json({ msg: "Passwords não condizem" });
    // }
    
    // const userExists = await Auth.findOne({ username });
    
    // if (userExists) {
    //   SendToLog({ Level: 'Error', Action: '/auth/register', Description: 'Username já existe', User: null });
    //   return res.status(422).json({ msg: "Username já existe" });
    // }

    // const nifExists = await Auth.findOne({ nif });

    // if(nifExists) {
    //   SendToLog({ Level: 'Error', Action: '/auth/register', Description: 'NIF já existe', User: null });
    //   return res.status(422).json({ msg: "NIF já existe" });
    // }

    // const emailExists = await Auth.findOne({ email });
    
    // if(emailExists) {
    //   SendToLog({ Level: 'Error', Action: '/auth/register', Description: 'email já existe', User: null });
    //   return res.status(422).json({ msg: "Email já existe" });
    // }

    const validateAndLogError = (field, errorMsg) => {
      SendToLog({ Level: 'Error', Action: '/auth/register', Description: errorMsg, User: null });
      return res.status(422).json({ msg: errorMsg });
    };
    
    if (!email) return validateAndLogError('Email', 'Email necessário');
    if (!name) return validateAndLogError('Name', 'Nome necessário');
    if (!username) return validateAndLogError('Username', 'Username necessário');
    if (!password) return validateAndLogError('Password', 'Password necessária');
    if (dubPassword !== password) return validateAndLogError('Password', 'Passwords não condizem');
    
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    
    const checkIfExists = async (field, value, errorMsg) => {
      const exists = await Auth.findOne({ [field]: value });
      if (exists){
        return validateAndLogError(field, errorMsg);
      } else{
        const auth = new Auth({
          username,
          password: hash
        });
        let generatedId;
        try {
          generatedId = await auth.save();
        } catch (err) {
          SendToLog({ Level: 'Error', Action: '/auth/register', Description: err, User: null });
          return res.status(500).json({ msg: err });
      }
  
      const user = new User({
          _id: generatedId,
          email,
          name,
          nif,
          role: 1
        });
        try {
          await user.save();
          SendToLog({ Level: 'Info', Action: '/auth/register', Description: req.body, User: null });
          return res.status(200).json(req.body);
        } catch (err) {
          SendToLog({ Level: 'Error', Action: '/auth/register', Description: err, User: null });
          return res.status(500).json({ msg: err });
      }
      }
    };
    
    await checkIfExists('username', username, 'Username já existe');
    await checkIfExists('nif', nif, 'NIF já existe');
    await checkIfExists('email', email, 'Email já existe');

    
    
  },
  login: async (req, res) => {
    const { username, password } = req.body;
    if (!username) {
      const logData = {
        Level: 'Error',
        Action: `/auth/login`,
        Description: 'Username is required',
        User: null
      };
      SendToLog(logData);
      return res.status(422).json({ msg: "Username is required" });
    } else if (!password) {
      const logData = {
        Level: 'Error',
        Action: `/auth/login`,
        Description: 'Password is required',
        User: null
      };
      SendToLog(logData);
      return res.status(422).json({ msg: "Password is required" });
    }
    const auth = await Auth.findOne({ username });
    if (!auth) {
      const logData = {
        Level: 'Error',
        Action: `/auth/login`,
        Description: 'Username not found',
        User: null
      };
      SendToLog(logData);
      return res.status(404).json({ msg: "Username not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, auth.password);
    if (!isPasswordValid) {
      const logData = {
        Level: 'Error',
        Action: `/auth/login`,
        Description: 'Invalid password',
        User: null
      };
      SendToLog(logData);
      return res.status(422).json({ msg: "Invalid password" });
    }
    const user = await User.findOne({ _id: auth._id });
    try {
      const secret = process.env.SECRET;
      const token = jwt.sign(
        {
          id: auth._id,
          role: user.role
        },
        secret,
        {
          expiresIn: tokenValidation
        }
      );
      const logData = {
        Level: 'Info',
        Action: `/auth/login`,
        Description: token,
        User: null
      };
      SendToLog(logData);
      res.status(200).json({ token });

    } catch (err) {
        const logData = {
            Level: 'Error',
            Action: `/auth/login`,
            Description: err,
            User: null
          };
          SendToLog(logData);
          res.status(500).json({ msg: err });
        }
    },

  changePassword:[
    checkToken,
    async (req, res) => {
        const { password, newPassword } = req.body;
    
        // Check if password is provided
        if (!password) {
          const error = { msg: 'Password necessária' };
          return res.status(422).json(error);
        }
    
        // Check if new password is provided
        if (!newPassword) {
          const error = { msg: 'Nova password necessária' };
          return res.status(422).json(error);
        }
    
        const userId = await getIdFromToken(req);
        const auth = await Auth.findOne({ _id: userId });
    
        // Check if authentication exists
        if (!auth) {
          const error = { msg: 'Autenticação necessária' };
          return res.status(404).json(error);
        }
    
        const isPasswordValid = await bcrypt.compare(password, auth.password);
    
        // Check if password is valid
        if (!isPasswordValid) {
          const error = { msg: 'Password inválida' };
          return res.status(422).json(error);
        }
    
        try {
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(newPassword, salt);
    
          // Update user password
          const updatedUser = await Auth.findOneAndUpdate(
            { username: auth.username },
            { password: hashedPassword }
          );
    
          const logData = {
            Level: 'Info',
            Action: '/auth/password',
            Description: updatedUser,
            User: userId
          };
    
          SendToLog(logData);
    
          return res.status(200).json({ updatedUser });
        } catch (err) {
          const logData = {
            Level: 'Error',
            Action: '/auth/password',
            Description: err,
            User: userId
          };
    
          SendToLog(logData);
    
          return res.status(500).json({ msg: err });
        }
      }
  ] 
};

module.exports = authController;
