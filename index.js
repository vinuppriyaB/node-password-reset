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
// async function addTokenInDb(email,token){
//     const result = await client
//     .db("B27rwd")
//     .collection("loginform")
//     .updateOne({ email:email }, { $set: {token:token} });
//    return result;

// }


app.post("/forget-password", async(request, response) => {
    const {email}=request.body;
    const isUserAvail=await checkAvailUser(email)
    if(isUserAvail)
    {
        const secret=process.env.SECRET_KEY ;
        const payload = {
            email:email
        }
        let token= jwt.sign(payload,secret,{expiresIn:"1h"});
        //  const addtoken= await addTokenInDb(email,token)
        const link = `https://login-proces.herokuapp.com/reset-password/${token}`;
        const result = await sendMail(email,link)
        response.send("user avail");
        
    }
    else {
        response.status(400).send({message:"user not available"});
        
    }
    
 });

 
//  app.get("/forget-password/id/token", async(request, response) => {
//      response.send({id:id,token:token})
//  });

 app.get("/reset-password/:token", async(request, response,next) => {
    
    try{
            
            let token=request.params.token;
            jwt.verify(token,
                process.env.SECRET_KEY,
                async(err,decode)=>{
                    if(decode!==undefined){
                      const document= await client.db("B27rwd").collection("loginform").findOneAndUpdate({email:decode.email},{$set:{password:token}}); 
                      console.log(document)
                        if(document)
                        {
                         
                            response.redirect("https://stoic-cray-4c696d.netlify.app/reset-password/"+token);

                        }          
                    }else{
                        response.status(401).json({message:"invalid token"});
                    }
                });
                
            }

            catch(error)
                {
                    console.log(error);
                    
                }
                    
 });
    




 app.post("/reset-password/user", async(request, response) => {
    //  const {id}=request.params;
    const {email,newpassword,token}=request.body;
    const hashPassword = await genPassword(newpassword); 
    const result = await client
        .db("B27rwd")
        .collection("loginform")
        .updateOne({password:token }, { $set: {password:hashPassword} });
        
        // const result1 = await client
        // .db("B27rwd")
        // .collection("loginform")
        // .updateOne({ token:token }, { $set: {token:null }});
        response.send(result);
 });
 
app.get("/", (request, response) => {
   response.send("hai")
});





app.use("/user",userRouter);

app.listen(PORT, () => console.log("the server is started in", PORT));
