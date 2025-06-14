// asyncHandler.js
const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
  return Promise.resolve(requestHandler(req, res, next))
    .catch(next);
  }
}

export {asyncHandler};

//const asyncHandler = () => {}
//  const asyncHandler = (func) =>()=> {}
//  const asyncHandler = (func) =>(aync)=> {}

/*
    
const asyncHandler = (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
} 
*/

