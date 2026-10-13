import jwt from 'jsonwebtoken'

const JWT_SECRET= process.env.JWT_SECRET

if(!JWT_SECRET){
    throw new Error('JWT_SECRET is not configured')
}

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
        token, 
        JWT_SECRET
    );
    
    req.user = decoded;
    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export default authMiddleware;