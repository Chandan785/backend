class ApiResponse{
    constructor(statuscode ,data ,massage = 'Success', success = true) {
        this.statusCode = statuscode < 400;
        this.data = data;
        this.message = massage;
        this.success = success;
    }
} 

export {ApiResponse};