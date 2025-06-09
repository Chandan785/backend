import {asyncHandler} from '../utils/asyncHandler.js';
 

const ragister = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "User registered successfully",
      
    });
})

export {ragisterUser}