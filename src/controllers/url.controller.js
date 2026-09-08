import { getAllUrls, createUrl, getUrlByShortCode,
        recordClick, updateUrlForUser, deleteUrlForUser 
      } from '../services/url.service.js';

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

export async function updateUrlController(req,res){
  try{
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
      return res.status(404).json({
        success: false,
        message: 'URL not found.'
      })
    }

    return res.status(200).json({
      success:true,
      data:{
        url:updatedUrl,
      }
    })
  }
  catch(error){
    if(error.code==='NO_UPDATE_FIELDS'){
      return res.status(400).json({
        success:false,
        message:'No fields provided for update.'
      })
    }
    console.error('Failed to update URL:', error);
    return res.status(500).json({
      success:false,
      message:'Failed to update URL.'
    })
  }
}

export async function deleteUrlController(req,res){
  try{
    const { shortCode } = req.params;

    const deletedUrl=await deleteUrlForUser({
      shortCode,
      userId:req.user.userId
    })
    
    if(!deletedUrl){
      return res.status(404).json({
        success:false,
        message:'URL not found.',
      })
    }

    return res.status(200).json({
      success:true,
      message:'URL deleted successfully',
    })
  }
  catch(error){
    console.error('Failed to delete URL:', error);
    return res.status(500).json({
      success:false,
      message:'Failed to delete URL.',
    })
  }
}