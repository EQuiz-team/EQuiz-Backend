import aj from '../config/arcjet.js';

export const arcjetMiddleware = async (req, res, next) => {
  try {
    // Log the request for debugging
    console.log('Arcjet middleware processing request:', req.method, req.path);
    
    // Make the protection request - check Arcjet SDK documentation for exact method
    const decision = await aj.protect(req, { requested: 1 });
    
    // Check the decision structure - common patterns:
    console.log('Arcjet decision:', decision);
    console.log('Decision type:', typeof decision);
    
    // Option 1: If decision is an object with a 'denied' property
    if (decision.denied || decision.isDenied) {
      const isDenied = decision.denied || (typeof decision.isDenied === 'function' ? decision.isDenied() : false);
      
      if (isDenied) {
        // Check for rate limiting
        if (decision.reason === 'RATE_LIMIT' || 
            (decision.reason && decision.reason.includes('rate')) ||
            decision.type === 'RATE_LIMIT') {
          console.log('Arcjet: Rate limited');
          return res.status(429).json({ 
            error: 'Too Many Requests',
            message: 'Please try again later'
          });
        }
        
        // Check for bot detection
        if (decision.reason === 'BOT' || 
            (decision.reason && decision.reason.includes('bot')) ||
            decision.type === 'BOT') {
          console.log('Arcjet: Bot detected');
          return res.status(403).json({ 
            error: 'Access Denied',
            message: 'Bot activity detected'
          });
        }
        
        // General denial
        console.log('Arcjet: Access denied');
        return res.status(403).json({ 
          error: 'Access Denied',
          message: 'Request blocked by security rules'
        });
      }
    }
    
    // Option 2: If decision has a 'conclusion' property (common in newer versions)
    if (decision.conclusion === 'DENY' || decision.conclusion === 'REJECT') {
      if (decision.reason === 'RATE_LIMIT') {
        return res.status(429).json({ error: 'Too Many Requests' });
      }
      if (decision.reason === 'BOT') {
        return res.status(403).json({ error: 'Bot Detected' });
      }
      return res.status(403).json({ error: 'Access Denied' });
    }
    
    // Option 3: If decision has a 'result' property
    if (decision.result === 'deny' || decision.result === 'reject') {
      if (decision.details && decision.details.reason === 'rate_limit') {
        return res.status(429).json({ error: 'Too Many Requests' });
      }
      return res.status(403).json({ error: 'Access Denied' });
    }
    
    // If no denial detected, allow the request
    console.log('Arcjet: Request allowed');
    next();
    
  } catch (error) {
    console.error('Arcjet Middleware Error:', error);
    
    // Don't block requests if Arcjet fails - fail open for availability
    // You might want to log this to monitoring instead
    console.warn('Arcjet failed, allowing request through:', error.message);
    
    // Continue to next middleware/route (fail open)
    next();
    
    // OR fail closed (more secure but less available):
    // return res.status(500).json({ 
    //   error: 'Security Service Unavailable',
    //   message: 'Please try again later'
    // });
  }
};

export default arcjetMiddleware;