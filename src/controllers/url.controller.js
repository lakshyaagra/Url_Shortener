import { getAllUrls, createUrl, getUrlByShortCode,
        recordClick, updateUrlForUser, deleteUrlForUser 
      } from '../services/url.service.js';

export async function getUrls(req, res) {
  const { page,limit,isActive,sortBy,order } = req.query;

  const result = await getAllUrls({
    userId: req.user.userId,
    page,
    limit,
    isActive,
    sortBy,
    order,
  });

  return res.status(200).json({
    success: true,
    data: result.urls,
    pagination: result.pagination,
  });
}

export async function createUrlController(req, res) {
    const { originalUrl } = req.body;

    const userId = req.user.userId;

    const url = await createUrl({
      userId,
      originalUrl,
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
}

export async function redirectUrl(req, res) {
    const { shortCode } = req.params;

    const url = await getUrlByShortCode(shortCode);

    if (!url) {
      const error = new Error('Short URL not found');
      error.statusCode = 404;
      throw error;
    }

    if (!url.isActive) {
      const error = new Error('Short URL is inactive');
      error.statusCode = 410;
      throw error;
    }

    if (url.expiresAt && url.expiresAt <= new Date()) {
      const error = new Error('Short URL has expired');
      error.statusCode = 410;
      throw error;
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
    
}

export async function updateUrlController(req,res){
    const { shortCode } = req.params;
    const { originalUrl, expiresAt, isActive } = req.body;

    const updatedUrl = await updateUrlForUser({
      shortCode,
      userId: req.user.userId,
      originalUrl,
      expiresAt,
      isActive,
    });

    if(!updatedUrl){
      const error = new Error('URL not found');
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({
      success:true,
      data:{
        url:updatedUrl,
      }
    })
}

export async function deleteUrlController(req,res){
    const { shortCode } = req.params;

    const deletedUrl=await deleteUrlForUser({
      shortCode,
      userId:req.user.userId
    })
    
    if(!deletedUrl){
      const error = new Error('URL not found');
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({
      success:true,
      message:'URL deleted successfully',
    })
}