const errorMiddleware = (err, req, res, next) => {
  try {
    let error={ ...err };
    error.message = err.message;
    console.error(err.stack);

    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      error.statusCode = 400;
      error.message = messages.join(', ');
    }

    if (err.name === 'CastError') {
        const message = `Resource not found. Invalid: ${err.path}`;
        error.statusCode = 404;
        error.message = message;
    }

    if (err.code === 11000) {
        const message = `Duplicate field value entered: ${JSON.stringify(err.keyValue)}`;
        error.statusCode = 400;
        error.message = message;
    }

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        error.statusCode = 400;
        error.message = messages.join(', ');
    }

    res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error'
    });
  } catch (error) {
    console.error('Error in error middleware:', error);
    res.status(500).json({
      error: 'Internal Server Error'
    });
  }
};

export default errorMiddleware;