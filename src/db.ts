import mongoose from "mongoose";
import { MONOGODB_URI } from "./const.js";
import * as bcrypt from "bcrypt";

const ticketSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
})

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    organizer: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    location: { type: String, required: true },
    tickets: [ticketSchema],
    image: { type: String, required: false },
})

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    auth_level: { type: Number, required: true },
})


mongoose.set('strictQuery', true);
mongoose.connect(MONOGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

export const Event = mongoose.model('Event', eventSchema);
export const User = mongoose.model('User', userSchema);
User.findOne({ username: "admin" }, async (err, user) => {
    if (user === null) {
        const admin = new User({
        username: "admin",
        password: await bcrypt.hash("admin", 10),
        auth_level: 3,
        });
        admin.save((err) => {
        if (err) {
            console.error("Failed to create admin: ", err);
            return;
        }
        console.log("Admin created successfully.");
        });
    }
    });

const dbSummary = <T>(model: mongoose.Model<T>) => {
    // log the number of documents in the collection
    model.countDocuments({}, (err, count) => {
        console.debug(`Number of ${model.modelName}s: `, count);
    });
}

dbSummary(User)
dbSummary(Event)