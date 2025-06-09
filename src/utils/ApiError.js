class ApiError extends Error {
  constructor(
    message = 'Something went wrong',
    errors = null,
     statusCode = 500,
     stack= ""
) 
  {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;

    if(stack) {
      this.stack = stack;
    }else{
        Error.captureStackTrace(this, this.constructor);
    }

  }

}

export { ApiError };