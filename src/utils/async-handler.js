export function asyncHandler(controller){
    return function(req,res,next){
        Promise.resolve(controller(req,res,next)).catch(next);
    };
}