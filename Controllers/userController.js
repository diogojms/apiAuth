const User = require("../Models/user");
const { SendToLog } = require("../logs");
const { checkToken } = require("../utils");
const { getIdFromToken } = require("../utils");

const userController = {
  /**
   * @swagger
   * /{id}:
   *   get:
   *     summary: Get user by ID
   *     description: Endpoint to retrieve user information by providing the user ID.
   *     tags:
   *       - User
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         description: ID of the user to retrieve
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       '200':
   *         description: User information retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 // Define your user properties here
   *       '422':
   *         description: Unprocessable Entity - User not found
   *       '401':
   *         description: Unauthorized - Invalid or revoked token used
   */
  getUserById: [
    checkToken,
    async (req, res) => {
      const id = req.params.id;
      let dataToLog;

      const user = await User.findById(id, "-_id");

      if (!user) {
        dataToLog = {
          Level: "Error",
          Action: `/user/${id}`,
          Description: user,
          User: await getIdFromToken(req),
        };
        SendToLog(dataToLog);

        return res.status(422).json({ msg: "Utilizador não encontrado" });
      }

      dataToLog = {
        Level: "Info",
        Action: `/user/getUser/${id}`,
        Description: user,
        User: await getIdFromToken(req),
      };
      SendToLog(dataToLog);

      res.status(200).json(user);
    },
  ],
  /**
   * @swagger
   * /changeInfo:
   *   post:
   *     summary: Change user information
   *     description: Endpoint to change user information (NIF, name, email) for the authenticated user.
   *     tags:
   *       - User
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       description: User information change data
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               newNIF:
   *                 type: string
   *               newName:
   *                 type: string
   *               newEmail:
   *                 type: string
   *     responses:
   *       '200':
   *         description: User information changed successfully
   *       '404':
   *         description: Not Found - User not found
   *       '500':
   *         description: Internal Server Error - Failed to change user information
   *       '401':
   *         description: Unauthorized - Invalid or revoked token used
   */
  changeInfo: [
    checkToken,
    async (req, res) => {
      try {
        const {
          newNIF,
          newName,
          newEmail,
          newAddress,
          newCity,
          newZipCode,
          newPhone,
          img,
        } = req.body;
        console.log("Dados recebidos:", {
          newNIF,
          newName,
          newEmail,
          newAddress,
          newCity,
          newZipCode,
          newPhone,
          img,
        });

        const userId = await getIdFromToken(req);
        const user = await User.findById(userId);

        console.log(userId);
        console.log(user);

        if (!user) {
          return res.status(404).json({ msg: "Usuário não encontrado" });
        }

        // Verifique a revogação do token
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        // Atualize as informações do usuário
        if (newNIF) user.nif = newNIF;
        if (newName) user.name = newName;
        if (newEmail) user.email = newEmail;
        if (newAddress) user.address = newAddress;
        if (newCity) user.city = newCity;
        if (newZipCode) user.zipcode = newZipCode;
        if (newPhone) user.phone = newPhone;
        if (img) user.img = img;

        console.log("Novas informações do usuário:", user);

        // Salve as alterações no banco de dados
        await user.save();

        console.log("Informações salvas com sucesso no banco de dados:", user);

        const logData = {
          Level: "Info",
          Action: "/users/changeInfo",
          Description: `Informações alteradas com sucesso para o usuário com ID: ${userId}`,
          User: userId,
        };

        SendToLog(logData);

        return res
          .status(200)
          .json({ msg: "Informações alteradas com sucesso" });
      } catch (err) {
        const logData = {
          Level: "Error",
          Action: "/users/changeInfo",
          Description: err.message,
          User: "Error",
        };

        SendToLog(logData);

        return res.status(500).json({ msg: "Erro interno do servidor" });
      }
    },
  ],
  /**
   * @swagger
   * /users/countUsers:
   *   get:
   *     summary: Count users
   *     description: Endpoint to count users
   *     tags:
   *       - User
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       '200':
   *         description: User count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: number
   *       '500':
   *         description: Internal Server Error - Failed to retrieve user count
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
  countUsers: [
    checkToken,
    async (req, res) => {
      try {
        const userCount = await User.countDocuments();

        const logData = {
          Level: "Info",
          Action: "/users/countUsers",
          Description: `Total count of users retrieved: ${userCount}`,
          User: await getIdFromToken(req),
        };

        SendToLog(logData);

        res.status(200).json({ count: userCount });
      } catch (err) {
        const logData = {
          Level: "Error",
          Action: "/users/countUsers",
          Description: err.message,
          User: "Error",
        };

        SendToLog(logData);

        res.status(500).json({ msg: "Erro interno do servidor" });
      }
    },
  ],

  getUsers: [
    checkToken,
    async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const role = req.query.role;

      if (limit > 100) {
        return res.status(400).json({ message: "Limit cannot exceed 100" });
      }

      const startIndex = (page - 1) * limit;

      // Build the query object
      let query = {};
      if (role !== undefined) {
        query.role = role;
      }

      try {
        const users = await User.find(query).skip(startIndex).limit(limit);
        const totalUsers = await User.countDocuments(query);

        const pagination = {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers: totalUsers,
        };

        res.json({ status: "success", users: users, pagination: pagination });
      } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
      }
    },
  ],

  uploadImg: [
    checkToken,
    async (req, res) => {
      try {
        const userId = await getIdFromToken(req);
        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).json({ msg: "Usuário não encontrado" });
        }

        if (req.body) {
          user.img = req.body;
          await user.save();

          const logData = {
            Level: "Info",
            Action: "/users/uploadImg",
            Description: `Imagem do usuário com ID ${userId} alterada com sucesso`,
            User: userId,
          };

          SendToLog(logData);

          return res.status(200).json({ msg: "Imagem alterada com sucesso" });
        } else {
          return res.status(400).json({ msg: "Nenhuma imagem enviada" });
        }
      } catch (err) {
        const logData = {
          Level: "Error",
          Action: "/users/uploadImg",
          Description: err.message,
          User: "Error",
        };

        SendToLog(logData);

        return res.status(500).json({ msg: "Erro interno do servidor" });
      }
    },
  ],

  deleteUser: [checkToken, async (req, res) => {
    const userId = req.params.id;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      await user.remove();
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }]
};

module.exports = userController;
