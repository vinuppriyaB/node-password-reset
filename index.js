import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import nodemailer from "nodemailer";
import {google} from "googleapis";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { genPassword,
    // createUser,
    // checkAvailUser
   } 
   from "./helper.js";


// import { movieRouter } from "./routes/movie.js";
import { userRouter } from "./routes/login.js";
// import { gmail } from "googleapis/build/src/apis/gmail";
// import { gmail } from "googleapis/build/src/apis/gmail";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8500;
const MONGO_URL = process.env.MONGO_URL;
// mongodb+srv://vinuppriya:<password>@cluster0.xu3bs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
app.use(express.json());
app.use(cors());


const CLIENT_ID=process.env.CLIENT_ID;
const CLIENT_SECRET=process.env.CLIENT_SECRET;
const REDIRECT_URI=process.env.REDIRECT_URI;
const REFRESH_TOKEN=process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI)
oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN})

async function sendMail(email,link){
    try{
        const accessToken=await oAuth2Client.getAccessToken();
        const transport=nodemailer.createTransport({
            service:"gmail",
            auth:{
                type:"OAuth2",
                user:"vinuppriya.b@gmail.com",
                clientId:CLIENT_ID,
                clientSecret:CLIENT_SECRET,
                refreshToken:REFRESH_TOKEN,
                accessToken:accessToken

            }
            
        })

        const mailOptions={
            from:"this is vinuppriya <vinuppriya.b@gmail.com>",
            to:email,
            subject:" gmail api",
            text:"heloo to it from gmailapi",
            html:`<h1>${link}</h1>`
        };
        const result = await transport.sendMail(mailOptions)
        return result;



    }catch(error){
        return error;

    }

}

// sendMail().then(result=> console.log("emailsent...",result))
// .catch(error =>console.log(error.message))



export async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("Mongodb connected");
  
  return client;
}

export const client = await createConnection();

async function checkAvailUser(email){
    const user = await client
        .db("B27rwd")
        .collection("loginform")
        .findOne({"email":email});
    
    return user;

}
async function checkAvailUserId(id){
    const user = await client
        .db("B27rwd")
        .collection("loginform")
        .findOne({"_id":id});

    return user;

}
async function addTokenInDb(email,token){
    const result = await client
    .db("B27rwd")
    .collection("loginform")
    .updateOne({ email:email }, { $set: {token:token} });
   return result;

}
let id=null;
let token=null;
app.post("/forget-password", async(request, response) => {
    const {email}=request.body;
    const isUserAvail=await checkAvailUser(email)
     id=isUserAvail._id;
    
    if(isUserAvail)
    {
        const secret=process.env.SECRET_KEY + isUserAvail.password;
        const payload = {
            email:email,
           
        }
         token= jwt.sign(payload,secret,{expiresIn:"15m"});
         const addtoken= await addTokenInDb(email,token)
        const link = `https://login-proces.herokuapp.com/reset-password/${id}/${token}`;
        const result = await sendMail(email,link)
        response.send("user avail");
        
    }
    else {
        response.status(400).send({message:"user not available"});
        
    }
    
 });

 
 app.get("/forget-password/id/token", async(request, response) => {
     response.send({id:id,token:token})
 });

 app.get("/reset-password/:id/:token", async(request, response) => {
    // const client = await mongoClient.connect(dbUrl);
    if(client){ 
        try{
            const db = client.db("B27rwd");
            JWT.verify(req.params.token,
                JWT_SECRET,
                async(err,decode)=>{
                    if(decode!==undefined){
                        document=await db.collection("loginform").findOneAndUpdate({email:decode.email},{$set:{password:token}}); 
                        if(document)
                        {
                         
res.redirect("https://distracted-saha-c5033b.netlify.app");
                        }          
                    }else{
                        res.status(401).json({message:"invalid token"});
                    }
                });
            
            client.close();
        }
        catch(error)
        {
            console.log(error);
            client.close();
        }
    }else{

        res.sendStatus(500);
    }

 });
    


//  app.get("/reset-password/:id/:token", async(request, response) => {
//     const {id,token}=request.params;
//     // const isUserAvail=await checkAvailUserId(id)
    
    
//         const secret=process.env.SECRET_KEY + isUserAvail.password;
//         try{
//             const payload= jwt.verify(token,secret);
//             response.redirect("https://distracted-saha-c5033b.netlify.app")
//             // response.send(payload)


//         }catch(error){
//             console.log(error.message)
//             response.send(error.message);
//         }
        
        
    
//     // else {
//     //     response.status(400).send({message:"user not available"});
        
//     // }
    
//  });

 app.post("/reset-password/user", async(request, response) => {
    //  const {id}=request.params;
    const {email,newpassword,token}=request.body;
    const hashPassword = await genPassword(newpassword);
    const result = await client
        .db("B27rwd")
        .collection("loginform")
        .updateOne({ token:token }, { $set: {password:hashPassword} });
        
        const result1 = await client
        .db("B27rwd")
        .collection("loginform")
        .updateOne({ token:token }, { $set: {token:null }});
        response.send(result1);
 });
 
app.get("/", (request, response) => {
   response.send("hai")
});





app.use("/user",userRouter);

app.listen(PORT, () => console.log("the server is started in", PORT));
