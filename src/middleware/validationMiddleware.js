const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRegister = (req, res, next) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim();
  const password = req.body.password;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Name is required.',
    });
  }

  if (name.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Name must contain at least 2 characters.',
    });
  }

  if (name.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Name cannot exceed 100 characters.',
    });
  }

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required.',
    });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required.',
    });
  }

  if (typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Password must be a string.',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters.',
    });
  }

  if (password.length > 128) {
    return res.status(400).json({
      success: false,
      message: 'Password cannot exceed 128 characters.',
    });
  }

  // Only mutate req.body after all validation succeeds.
  req.body.name = name;
  req.body.email = email;

  next();
};

const validateLogin = (req, res, next) => {
  const email = req.body.email?.trim();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    });
  }

  if (typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Password must be a string.',
    });
  }

  req.body.email = email;

  next();
};

const validateCreateUrl = (req, res, next) => {
  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({
      success: false,
      message: 'originalUrl is required.',
    });
  }

  if (typeof originalUrl !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'originalUrl must be a string.',
    });
  }

  const trimmedUrl = originalUrl.trim();

  if (!trimmedUrl) {
    return res.status(400).json({
      success: false,
      message: 'originalUrl is required.',
    });
  }

  // URL Validation
    let parsedUrl;
    // JavaScript provides the built-in URL class.
    // example :- For: https://github.com/
    // it successfully creates a URL object.
    // but for originalUrl "hello"- response will be Invalid Url

  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL.',
    });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({
      success: false,
      message: 'Only HTTP and HTTPS URLs are allowed.',
    });
  }

  req.body.originalUrl = parsedUrl.toString();

  next();
};

const validateUpdateUrl = (req, res, next) => {
  const { originalUrl, expiresAt, isActive } = req.body;

  if (
    originalUrl === undefined &&
    expiresAt === undefined &&
    isActive === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: 'At least one field must be provided for update.',
    });
  }

  if (originalUrl !== undefined) {
    if (typeof originalUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'originalUrl must be a string.',
      });
    }

    const trimmedUrl = originalUrl.trim();

    if (!trimmedUrl) {
      return res.status(400).json({
        success: false,
        message: 'originalUrl cannot be empty.',
      });
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(trimmedUrl);
    } catch {
        return res.status(400).json({
            success: false,
            message: 'originalUrl must be a valid URL.',
        });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({
            success: false,
            message: 'Only HTTP and HTTPS URLs are allowed.',
        });
    }

    req.body.originalUrl = parsedUrl.toString();
  }

  if (expiresAt !== undefined) {
    const date = new Date(expiresAt);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'expiresAt must be a valid date.',
      });
    }
    req.body.expiresAt = date;
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive must be a boolean.',
    });
  }

  next();
};

export {
  validateRegister,
  validateLogin,
  validateCreateUrl,
  validateUpdateUrl,
};