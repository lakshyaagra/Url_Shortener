import { createUrl } from '../services/url.service.js';
import { getAnonymousUserId } from '../services/anonymous-user.service.js';

// POST /api/v1/urls/public: create a short link without an account.
// The link belongs to the reserved anonymous user, so no logged-in user can edit or delete it.
export async function createPublicUrlController(req, res) {
    const userId = await getAnonymousUserId();

    const url = await createUrl({ 
        userId, 
        originalUrl: req.body.originalUrl 
    });

    return res.status(201).json({
        success: true,
        data: {
            shortCode: url.shortCode,
            originalUrl: url.originalUrl,
            createdAt: url.createdAt,
        },
    });
}