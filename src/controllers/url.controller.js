import { getAllUrls, createUrl } from '../services/url.service.js';

export async function getUrls(_, res) {
  try {
    const urls = await getAllUrls();

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

    const userId = 1;

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