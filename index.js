const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PROT || 5000;


// middleWare

app.use(cors({
     origin: [
          'https://cars-doctor-1ea5c.web.app',
          'https://cars-doctor-1ea5c.firebaseapp.com'


     ],
     credentials: true
}));
app.use(express.json());
app.use(cookieParser());







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3y9ux.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
     serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
     }
});

const logger = (req, res, next) => {
     console.log(req.method, req.url);

     next();
};
const verifyToken = (req, res, next) => {
     const token = req?.cookies?.token;
     if (!token) {
          return res.status(401).send({ message: 'unauthorized access' });
     }
     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err) {
               return res.status(401).send({ message: 'unauthorized access' });
          }
          req.user = decoded
          next()
     })
}

async function run() {
     try {
          // Connect the client to the server	(optional starting in v4.7)
          await client.connect();


          const careDoctorDataBase = client.db("CarsDoctor");

          const servicesCollection = careDoctorDataBase.collection("services");

          const bookingServices = client.db('CarsDoctor').collection('booking');
          // auth related api
          app.post('/jwt', async (req, res) => {
               const userEmail = req.body;
               console.log('user for token', userEmail)
               const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
               res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none'
               })
                    .send({ success: true })
               console.log(userEmail)
          });

          app.post('/logOut', async (req, res) => {
               const user = req.body;
               console.log(user)
               res.clearCookie('token', { maxAge: 0 })
                    .send({ success: true })
          })



          // services related api 

          app.get('/services', async (req, res) => {
               const curser = servicesCollection.find();
               const result = await curser.toArray();
               res.send(result);
          });

          app.get('/services/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) };

               const options = {


                    projection: { title: 1, img: 1, price: 1, service_id: 1 },
               };
               const result = await servicesCollection.findOne(query, options);
               res.send(result)
          });
          // Booking
          app.post('/bookings', async (req, res) => {
               const booking = req.body;
               const result = await bookingServices.insertOne(booking);
               res.send(result);

          });
          app.get('/bookings', logger, verifyToken, async (req, res) => {
               if (req.user.email !== req.query.email) {
                    return res.status(403).send({ message: 'forbidden access' })
               }
               let query = {};
               if (req.query?.email) {
                    query = { email: req.query.email }
               }
               const curser = bookingServices.find(query);
               const result = await curser.toArray();
               res.send(result)
          });

          app.delete('/bookings/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) };
               const result = await bookingServices.deleteOne(query);
               res.send(result)
          });

          app.patch('/bookings/:id', async (req, res) => {
               const id = req.params.id;
               const filter = { _id: new ObjectId(id) };
               const updateBooking = req.body;
               const updateDoc = {
                    $set: {
                         status: updateBooking.status
                    }
               };
               const result = await bookingServices.updateOne(filter, updateDoc);
               res.send(result);
          });

          app.post('/jwt', async (req, res) => {
               const user = req.body;

               const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: '1h'
               });

               res
                    .cookie('token', token, {
                         httpOnly: true,
                         secure: false
                    })
                    .send({ success: true })
          })


          // Send a ping to confirm a successful connection
          await client.db("admin").command({ ping: 1 });
          console.log("Pinged your deployment. You successfully connected to MongoDB!");
     } finally {
          // Ensures that the client will close when you finish/error
          // await client.close();
     }
}
run().catch(console.dir);




app.get('/', (req, res) => {
     res.send('Car Doctor Server Running');
});

app.listen(port, () => {
     console.log(`car doctor server is Running Port ${port}`)
})