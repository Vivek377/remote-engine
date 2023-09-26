const express = require("express");
const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const nodeMailer = require("nodemailer")
require("dotenv").config();


const userRoute = express.Router();


const sendEmail = (name, email, id) => {
    try {

        const transporter = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: 'triwizard57@gmail.com',
                pass: process.env.PASS
            }
        })

        const mailOptions = {
            from: "triwizard57@gmail.com",
            to: email,
            subject: "Verification Mail",
            html: `<p>Hi ${name},
            Please click <a href="https://friendly-pig-toga.cyclic.cloud/user/verify?id=${id}">here</a> to verify Your Email</p>`
        }
        console.log("Sent");
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Email sent", info.response);
            }
        })

    } catch (e) {
        console.log(e);
    }
}

const sendWorkTimeEmail = (name, email, totalTime, start, end) => {
    try {

        const transporter = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: 'triwizard57@gmail.com',
                pass: process.env.PASS
            }
        })

        const mailOptions = {
            from: "vk640890@gmail.com",
            to: email,
            subject: "Today's WorkTime",
            html: `<p>Hello ${name},</br>
            Your Total Dashboard time is ${totalTime} Hours, your start time is ${start}, and stop time is
            ${end}</br>
            Thank you,</br>
            Vivek Kumar</p>`
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Email sent", info.response);
            }
        })

    } catch (e) {
        console.log(e);
    }
}


userRoute.post("/register", async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        const user = await UserModel.findOne({ email });

        if (user) {
            res.status(200).send({ msg: "user already present" });
        } else {

            bcrypt.hash(password, 4, async (err, hashed) => {

                if (err) {
                    res.status(400).send({ err: err });

                } else {

                    const newUser = new UserModel({ fullName, email, password: hashed, isVerified: false })
                    await newUser.save();

                    if (newUser) {
                        sendEmail(fullName, email, newUser._id);
                        res.status(200).send({ msg: "user signed up" });
                    }
                }

            })
        }

    } catch (e) {
        console.log(e);
        res.status(400).send({ err: e.message });
    }
})



userRoute.get("/verify", async (req, res) => {
    try {
        const { id } = req.query;
        const response = await UserModel.updateOne({ _id: id }, { $set: { isVerified: true } })

        res.status(200).send({ msg: "email-verified" });
    } catch (e) {
        res.status(400).send({ err: e.message });
    }
})


userRoute.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email });

        if (user) {

            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    res.status(200).send({ msg: "user logged in", token: jwt.sign({ userId: user._id }, "secret"), isVerified: user.isVerified });
                } else {
                    res.status(400).send({ err: "invalid password" })
                }
            })
        } else {
            res.status(400).send({ msg: "no user found" });
        }
    } catch (e) {
        console.log(e);
        res.status(400).send({ err: e.message });
    }
})


userRoute.post("/reset", async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await UserModel.findOne({ email })

        if (user) {

            bcrypt.hash(password, 4, async (err, hashed) => {

                if (err) {
                    res.status(400).send({ err: err });

                } else {

                    const response = await UserModel.updateOne({ _id: user._id }, { $set: { password: hashed } })
                    console.log(response);
                    res.status(200).send({ msg: "password updated" })
                }

            })
        } else {
            res.status(400).send({ msg: "no user with this email" })
        }

    } catch (e) {
        console.log(e);
        res.status(400).send({ err: e.message });
    }
})

userRoute.post("/worktime", async (req, res) => {
    try {
        const token = req.headers.authorization;
        const { start, totalTime, end } = req.body;

        console.log(token);
        const decoded = jwt.verify(token, "secret");

        const user = await UserModel.findOne({ _id: decoded.userId });

        sendWorkTimeEmail(user.fullName, user.email, totalTime, start, end);

        res.status(200).send({ msg: "email sent" });

    } catch (e) {
        console.log(e);
        res.status(400).send({ err: e.message });
    }
})

module.exports = userRoute;
