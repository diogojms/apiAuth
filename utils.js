const jwt = require('jsonwebtoken');

async function getIdFromToken(req){
    const usertoken = req.headers.authorization;
    const token = usertoken.split(' ');
    const tokenData = jwt.verify(token[1], process.env.SECRET);
    return tokenData.id;
}

function checkToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ msg: "Token inválida" });
    }

    try {
        const secret = process.env.SECRET;
        jwt.verify(token, secret);
        next();
    } catch (err) {
        console.error("Error verifying token:", err);
        res.status(401).json({ msg: "Erro na verificação do token", error: err.message });
    }
}


module.exports = {
    getIdFromToken,
    checkToken
};