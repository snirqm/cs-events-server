const mongoose = require('mongoose')
// Example of a full JSON for event creation:
// {
// "title": "DC Convention",
// "category": "Convention",
// "description": "First Ever DC Convention with Actor
// Interviews! A Must for All DC Fans.",
// "organizer": "WB-DC Team",
// "start_date": “2024-01-07T10:00”,
// “end_date”: “2024-01-07T19:00”,
// “location”: “Expo Tel Aviv”,
// “tickets”:[
// {“name“:”Entrance”, “quantity”:800, “price”:20},
// {“name”:“Interview”, “quantity”:300, “price”:30},
// {“name”:“Meetups”, “quantity”:100, “price”:70}
// ],
// "image":"https:images.thedirect.com/media/photos/comics
// -dc.jpg”
// }
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
module.exports = mongoose.model('Event', eventSchema)
