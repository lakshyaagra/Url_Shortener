import { getAllUrls, createUrl, getUrlByShortCode, recordClick } from '../services/url.service.js';

export async function getUrls(req, res) {
  try {
    const urls = await getAllUrls(req.user.userId);

    res.json({
      success: true,
      data: urls,
    });
  } catch (error) {
    console.error('Failed to fetch URLs:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch URLs',
    });
  }
}

export async function createUrlController(req, res) {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        message: 'originalUrl is required',
      });
    }

    // URL Validation
    let parsedUrl;
    // JavaScript provides the built-in URL class.
    // example :- For: https://github.com/
    // it successfully creates a URL object.
    // but for originalUrl "hello"- response will be Invalid Url

    try {
      parsedUrl = new URL(originalUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL',
      });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        success: false,
        message: 'Only HTTP and HTTPS URLs are allowed',
      });
    }

    const userId = req.user.userId;

    const url = await createUrl({
      userId,
      originalUrl: parsedUrl.toString(),
    });

    res.status(201).json({
      success: true,
      data: {
        id: url.id,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
        isActive: url.isActive,
      },
    });
  } catch (error) {
    console.error('Failed to create URL:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create URL',
    });
  }
}

export async function redirectUrl(req, res) {
  try {
    const { shortCode } = req.params;

    const url = await getUrlByShortCode(shortCode);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'Short URL not found',
      });
    }

    if (!url.isActive) {
      return res.status(410).json({
        success: false,
        message: 'Short URL is inactive',
      });
    }

    if (url.expiresAt && url.expiresAt <= new Date()) {
      return res.status(410).json({
        success: false,
        message: 'Short URL has expired',
      });
    }

    await recordClick({
      urlId: url.id,
      ipAddress: req.ip,       // Express gives us the request IP.
      userAgent: req.get('user-agent') || null,
      referrer: req.get('referer') || null,  // HTTP uses the historical header name:
    });

    return res.redirect(url.originalUrl);
    // Suppose:
    // url.originalUrl
    // =
    // https://www.youtube.com/
    // Express sends a redirect response.
    // The browser then navigates to:
    // https://www.youtube.com/
    // So our backend becomes a real URL shortener.
    
  } catch (error) {
    console.error('Failed to redirect URL:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to redirect URL',
    });
  }
}