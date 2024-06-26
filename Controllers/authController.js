const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Auth = require("../Models/auth");
const User = require("../Models/user");
const { SendToLog } = require("../logs");
const { checkToken } = require("../utils");
const { getIdFromToken } = require("../utils");

const tokenValidation = 60 * 60 * 6;

const revokedTokens = [];

// ... outras importações e constantes ...

const authController = {
  /**
   * @swagger
   * /register:
   *   post:
   *     summary: Register a new user
   *     description: Endpoint to register a new user with the provided information.
   *     tags:
   *       - Authentication
   *     requestBody:
   *       description: User registration data
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               name:
   *                 type: string
   *               nif:
   *                 type: string
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *               dubPassword:
   *                 type: string
   *               role:
   *                 type: string
   *             required:
   *               - email
   *               - name
   *               - username
   *               - password
   *               - role
   *     responses:
   *       '200':
   *         description: User successfully registered
   *       '422':
   *         description: Unprocessable Entity - Invalid input data
   *       '500':
   *         description: Internal Server Error - Registration failed
   */
  register: async (req, res) => {
    const {
      email,
      name,
      nif,
      address,
      city,
      zipcode,
      phone,
      username,
      password,
      dubPassword,
      role,
    } = req.body;

    const validateAndLogError = (field, errorMsg) => {
      SendToLog({
        Level: "Error",
        Action: "/auth/register",
        Description: errorMsg,
        User: null,
      });
      if (!res.headersSent) {
        return res.status(422).json({ msg: errorMsg });
      }
    };

    if (!email) return validateAndLogError("Email", "Email necessário");
    if (!name) return validateAndLogError("Name", "Nome necessário");
    if (!nif) return validateAndLogError("Nif", "Nif necessário");
    if (!address) return validateAndLogError("Address", "Address necessário");
    if (!city) return validateAndLogError("City", "City necessário");
    if (!zipcode) return validateAndLogError("Zipcode", "Zipcode necessário");
    if (!phone) return validateAndLogError("Phone", "Phone necessário");
    if (!username)
      return validateAndLogError("Username", "Username necessário");
    if (!password)
      return validateAndLogError("Password", "Password necessária");
    if (!role) return validateAndLogError("Role", "Role necessária");
    if (dubPassword !== password)
      return validateAndLogError("Password", "Passwords não condizem");

    try {
      const existsUsername = await Auth.findOne({ username });
      const existsNif = await Auth.findOne({ nif });
      const existsEmail = await Auth.findOne({ email });
      const existsPhone = await Auth.findOne({ phone });

      if (existsUsername)
        return validateAndLogError("Username", "Username já existe");
      if (existsNif) return validateAndLogError("NIF", "NIF já existe");
      if (existsEmail)
        return validateAndLogError("Email", "Email já existe", 401);
      if (existsPhone) return validateAndLogError("phone", "Phone já existe");

      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(password, salt);

      const auth = new Auth({
        username,
        password: hash,
      });

      const savedAuth = await auth.save();

      const user = new User({
        _id: savedAuth._id,
        email,
        name,
        nif,
        address,
        city,
        zipcode,
        phone,
        role,
      });

      await user.save();

      SendToLog({
        Level: "Info",
        Action: "/auth/register",
        Description: req.body,
        User: null,
      });
      if (!res.headersSent) {
        return res.status(200).json(req.body);
      }
    } catch (err) {
      SendToLog({
        Level: "Error",
        Action: "/auth/register",
        Description: err,
        User: null,
      });
      if (!res.headersSent) {
        return res.status(500).json({ msg: err });
      }
    }
  },

  /**
   * @swagger
   * /login:
   *   post:
   *     summary: Authenticate user and generate JWT token
   *     description: Endpoint to authenticate a user using their username and password, and generate a JWT token.
   *     tags:
   *       - Authentication
   *     requestBody:
   *       description: User login data
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *             required:
   *               - username
   *               - password
   *     responses:
   *       '200':
   *         description: Authentication successful, JWT token generated
   *       '401':
   *         description: Unauthorized - Revoked token used
   *       '404':
   *         description: Not Found - Username not found
   *       '422':
   *         description: Unprocessable Entity - Invalid username or password
   *       '500':
   *         description: Internal Server Error - Authentication failed
   */
  login: async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);
    if (!username) {
      const logData = {
        Level: "Error",
        Action: `/auth/login`,
        Description: "Username is required",
        User: null,
      };
      SendToLog(logData);
      return res.status(422).json({ msg: "Username is required" });
    } else if (!password) {
      const logData = {
        Level: "Error",
        Action: `/auth/login`,
        Description: "Password is required",
        User: null,
      };
      SendToLog(logData);
      return res.status(422).json({ msg: "Password is required" });
    }
    const auth = await Auth.findOne({ username });
    if (!auth) {
      const logData = {
        Level: "Error",
        Action: `/auth/login`,
        Description: "Username not found",
        User: null,
      };
      SendToLog(logData);
      return res.status(404).json({ msg: "Username not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, auth.password);
    if (!isPasswordValid) {
      const logData = {
        Level: "Error",
        Action: `/auth/login`,
        Description: "Invalid password",
        User: null,
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
          name: user.name,
          email: user.email,
        },
        secret,
        {
          expiresIn: tokenValidation,
        }
      );
      if (revokedTokens.includes(token)) {
        const logData = {
          Level: "Error",
          Action: `/auth/logout`,
          Description: "Revoked token used",
          User: null,
        };
        SendToLog(logData);
        return res.status(401).json({ msg: "Revoked token used" });
      } else {
        const logData = {
          Level: "Info",
          Action: `/auth/login`,
          Description: token,
          User: null,
        };
        SendToLog(logData);
        res.status(200).json({
          token,
          tokenValidation,
          name: user.name,
          id: user.id,
          city: user.city,
        });
      }
    } catch (err) {
      const logData = {
        Level: "Error",
        Action: `/auth/login`,
        Description: err,
        User: null,
      };
      SendToLog(logData);
      res.status(500).json({ msg: err });
    }
  },
  /**
   * @swagger
   * /password:
   *   post:
   *     summary: Change user password
   *     description: Endpoint to change the password of the authenticated user.
   *     tags:
   *       - Authentication
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       description: User password change data
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               password:
   *                 type: string
   *               newPassword:
   *                 type: string
   *             required:
   *               - password
   *               - newPassword
   *     responses:
   *       '200':
   *         description: Password changed successfully
   *       '401':
   *         description: Unauthorized - Revoked token used
   *       '404':
   *         description: Not Found - Authentication not found
   *       '422':
   *         description: Unprocessable Entity - Invalid password or new password not provided
   *       '500':
   *         description: Internal Server Error - Password change failed
   */
  changePassword: [
    checkToken,
    async (req, res) => {
      const { password, newPassword } = req.body;
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      // Check if password is provided
      if (!password) {
        const error = { msg: "Password necessária" };
        return res.status(422).json(error);
      }

      // Check if new password is provided
      if (!newPassword) {
        const error = { msg: "Nova password necessária" };
        return res.status(422).json(error);
      }

      const userId = await getIdFromToken(req);
      const auth = await Auth.findOne({ _id: userId });

      // Check if authentication exists
      if (!auth) {
        const error = { msg: "Autenticação necessária" };
        return res.status(404).json(error);
      }

      const isPasswordValid = await bcrypt.compare(password, auth.password);

      // Check if password is valid
      if (!isPasswordValid) {
        const error = { msg: "Password inválida" };
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

        if (revokedTokens.includes(token)) {
          // Token revogado, trate a solicitação de acordo
          const logData = {
            Level: "Error",
            Action: `/auth/logout`,
            Description: "Revoked token used",
            User: null,
          };
          SendToLog(logData);
          return res.status(401).json({ msg: "Revoked token used" });
        } else {
          const logData = {
            Level: "Info",
            Action: "/auth/password",
            Description: updatedUser,
            User: userId,
          };

          SendToLog(logData);

          return res.status(200).json({ updatedUser });
        }
      } catch (err) {
        const logData = {
          Level: "Error",
          Action: "/auth/password",
          Description: err,
          User: userId,
        };

        SendToLog(logData);

        return res.status(500).json({ msg: err });
      }
    },
  ],
  // Rota para logout
  /**
   * @swagger
   * /logout:
   *   post:
   *     summary: Logout user
   *     description: Endpoint to log out the authenticated user, revoking the current session token.
   *     tags:
   *       - Authentication
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       '200':
   *         description: Logout successful, session token revoked
   *       '401':
   *         description: Unauthorized - Invalid or revoked token used
   *     headers:
   *       - name: Authorization
   *         in: header
   *         description: Bearer token for authentication
   *         required: true
   *         schema:
   *           type: string
   *           format: "Bearer {token}"
   */
  logout: [
    checkToken,
    async (req, res) => {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      revokedTokens.push(token);

      const logData = {
        Level: "Info",
        Action: `/auth/logout`,
        Description: "User logged out",
        User: null,
      };
      SendToLog(logData);

      res.status(200).json({ msg: "Logout successful" });
    },
  ],

  recovery: async (req, res) => {
    const { email, newPassword } = req.body;

    try {
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // Find the corresponding auth record by user ID
      const auth = await Auth.findOne({ _id: user._id });
      if (!auth) {
        return res.status(404).json({ msg: "Auth record not found" });
      }

      // Hash the new password before saving it
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update the password in the auth record
      auth.password = hashedPassword;
      await auth.save();

      // Return a success response
      return res.status(200).json({ msg: "Password updated successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
};

module.exports = authController;
