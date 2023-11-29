const mongoose = require('mongoose'); //using mongoose object we have to create connection


const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log('Mongodb Database Connection is successfully established');

    }
    catch (error) {
        console.log("Database Connection Problem: " + error);
        process.exit(1);
    }
}
module.exports = connectDB;
