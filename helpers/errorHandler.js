function errorHandler(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        //JWT authentication error
        return res.status(401).json({
            message: "The User is not authorized"
        });
    }
    if (err.name === 'ValidationError') {
        //Validation Error
        return res.status(401).json({
            message: err
        });
    }
    //Server error
    return res.status(500).json({
        message: "Error en el servidor"
    });
}

module.exports = errorHandler;