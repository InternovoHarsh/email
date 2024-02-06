const express = require("express");
const cors = require("cors");
const multer = require("multer");
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const helmet = require('helmet');



require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());


// Define an array of allowed origins (replace these with your actual allowed origins)
// const allowedOrigins = ['http://example1.com', 'https://example2.com'];

// Use cors middleware with allowed origins
app.use(cors({
  origin: "*",
  methods: 'GET,POST',
  credentials: true,
}));



// meaning that each IP address is allowed to make up to 100 requests within the 15-minute window.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Validation middleware
const validateInputs = [
  body("name").notEmpty().withMessage("Name is required").isLength({max:30}),
  body("email").notEmpty().isEmail().withMessage("Invalid email address"),
  body("message").isLength({max:20}),
  body("dest").notEmpty().withMessage("Destination is required"),
  body("website").notEmpty().withMessage("Website is required"),
];

const storage = multer.memoryStorage();
const upload = multer({ storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }  });

app.post("/upload_files", upload.array("files"), validateInputs,uploadFiles);

function uploadFiles(req, res) {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  // Get form data
  const name = req.body.name;
  const email = req.body.email;
  const phoneNum = req.body.phoneNum;
  const message = req.body.message;
  const dest = req.body.dest;
  const website = req.body.website;
  // console.log(dest,website)

  try {
    // Get uploaded files
    const files = req.files;

    // Set up Nodemailer transporter
    let mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL,
        pass: process.env.PASS
      }
    });

    const phoneNumText = phoneNum ? `\n Phone Number : ${phoneNum}` : '';
    const nameText = name ? `\n name : ${name}` : '';
    const messageText = message ? `\n message : ${message}` : '';


    // Prepare mail details
    let mailDetails = {
      from: process.env.MAIL,
      to: `${dest}`,
      subject: `Mail from ${website} website`,
      text: `\n Mail obtained from ${website} website \n Sender's Detail \n  ${nameText} , \n email : ${email},\n ${messageText}  \n ${phoneNumText}`,
      attachments: files.map(file => ({
        filename: file.originalname,
        content: file.buffer
      }))
    };

    // Send the email
    mailTransporter.sendMail(mailDetails, function (err, data) {
      if (err) {
        console.log('Error Occurs', err);
        res.status(500).json({ error: 'Error sending email' });
      } else {
        console.log('Email sent successfully');
        res.json({ message: 'Email sent successfully' });
      }
    });
  } catch (error) {
    console.error('Error processing files', error);
    res.status(500).json({ error: 'Error processing files' });
  }
}

app.listen(5000, () => {
  console.log(`Server started on http://localhost:5000`);
});
