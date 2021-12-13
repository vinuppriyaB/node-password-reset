import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import nodemailer from "nodemailer";
import {google} from "googleapis";

// import { movieRouter } from "./routes/movie.js";
import { userRouter } from "./routes/login.js";
// import { gmail } from "googleapis/build/src/apis/gmail";
// import { gmail } from "googleapis/build/src/apis/gmail";



dotenv.config();
const CLIENT_ID="628736294675-4lb99fi5irie8duta6q6h1d5f762ubcp.apps.googleusercontent.com";
const CLIENT_SECRET="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";
const REDIRECT_URI="https://developers.google.com/oauthplayground";
const REFRESH_TOKEN="1//04-PaGJciqykZCgYIARAAGAQSNwF-L9IrSg0qDdnl2hKRkmJ6kN4Wjg9vqP8AcO59hIP-iIoyF0n5jBtPJQs23IFmOU1jRAVqGAM";

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI)
oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN})

async function sendMail(email){
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
            html:"<h1>hai ...its check from frontend</h1>"
        };
        const result = await transport.sendMail(mailOptions)
        return result;



    }catch(error){
        return error;

    }

}

// sendMail().then(result=> console.log("emailsent...",result))
// .catch(error =>console.log(error.message))

const app = express();
const PORT = process.env.PORT || 8500;
const MONGO_URL = process.env.MONGO_URL;
// mongodb+srv://vinuppriya:<password>@cluster0.xu3bs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
app.use(express.json());
app.use(cors());

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
app.post("/forget-password", async(request, response) => {
    const {email}=request.body;
    const isUserAvail=await checkAvailUser(email)
    
    if(isUserAvail)
    {
        const result = await sendMail(email)
        response.send("user avail");
        
    }
    else {
        response.status(400).send({message:"user not available"});
        
    }
    
 });
 
app.get("/", (request, response) => {
   response.send("hai")
});



// app.use("/movies",movieRouter);

app.use("/user",userRouter);
// app.get("/question", (request, response) => {
//   response.send("hai");
// });

app.listen(PORT, () => console.log("the server is started in", PORT));
