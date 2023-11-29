const mongoURI =
  "mongodb+srv://shoilirozario:PRXtTlGPPSl9rEI5@page-builder-cluster.nv8fuao.mongodb.net/?retryWrites=true&w=majority";
const express = require("express");
const dotenv = require("dotenv").config();
const app = express();
const port = 3000;
const cors = require('cors');
const session = require('express-session');
const flash = require('connect-flash');

const Goal = require("./models/goalModel");

// const buttonRoutes = require("./routes/buttonRoutes");
const connectDB = require('./config/db');
const buttonModel = require("./models/buttonModel");

app.use(express.static('public'));
app.use(express.static('assets'));
const corsOptions = {
  origin: ['http://localhost/', 'https://localhost/pagebuilderztrios'],
};
app.use(cors({ corsOptions }));



connectDB();

// app.get('/getGoals',async (req, res, next) => {
//   try{
//     const goals = await Goal.find({});
//     res.json( goals);
//   }catch(err){
//     res.json({'error': err});
//   }
// })
// app.post('/setGoals',async (req, res, next) => {
//   try{
//       const m = await Goal.create({
//         name: "shoili"
//       });
//       res.json(m);    
//   }catch(err){
//     res.json({'error': err});
//   }
// })

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'mysecret123',
  resave: true,
  saveUninitialized: true
}));

app.use(flash());

app.get('/', (req, res) => {
  req.flash('message', 'This is a message from the "/" endpoint');
  res.redirect('/contact');
});

app.get('/contact', (req, res) => {

  res.send(req.flash('succ'));
});
// app.set('views', __dirname + '/views');

// Define a route to render a view
app.use("/buttons", require("./routes/buttonRoutes"));
app.use("/sections", require("./routes/createSectionRoutes"));
app.use('/auth', require('./routes/authRoute'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/user_template_info', require('./routes/userTemplateInfoRoutes'));
app.use('/inventory', require('./routes/productRoutes'));
app.use('/service', require('./routes/serviceRoutes'));
app.use('/user', require('./routes/userRoutes'));

// routes
// app.post("/post_btn_data", upload.single("btn_img"), (req, res) => {

//   const btnCategory = req.body.btn_category;
//   const btnCode = req.body.btn_code;
//   const status = req.body.status;

//   const btnImage = req.file;

//   if (btnImage) {
//     const { filename, path } = btnImage;
//     const imageUrl = `/uploads/${filename}`; // URL where the image can be accessed

//     // Save the image URL to the database
//   const button = buttonModel.create({
//       category: btnCategory,
//       code:btnCode,
//       status:1,
//       btn_img_url: imageUrl, // Store the image URL in the database
//     });

//     res.status(200).json(button);

//   } else {
//     // No image was uploaded
//     console.log("No image uploaded.");
//     res.status(400).json({ error: "No image uploaded" });
//   }
// });
// app.use("/", buttonRoutes); // GET all products

app.listen(port, () => {
  console.log(`http://localhost:${port}/`);

  // console.log(`Example app listening on port ${port}`);
});

