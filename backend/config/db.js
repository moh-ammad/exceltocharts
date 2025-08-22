import mongoose from 'mongoose';

const connectTodb=async()=>{
    const dbUrl=process.env.MONGODB_URL;
    if(!dbUrl){
        console.error("MONGODB_URL is not defined in .env file");
        process.exit(1);
    }
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to MongoDb");
    } catch (error) {
        console.log("Error connecting to MongoDb:", error);
        process.exit(1);
    }
}

export default connectTodb;