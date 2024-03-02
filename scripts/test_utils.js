import fetch from "node-fetch"
import { randomInt } from 'crypto';
import assert from 'assert';
export const args = process.argv.slice(2);
assert(args.length <= 1, 'usage: node test.js [url]');
export const SERVER_URL = (args.length == 0) ? 'http://localhost:3000' : args[0];

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomName(numberOfNames = randomInt(4) + 1) {
    return Array.from({ length: numberOfNames }, () =>
        Array.from({ length: randomInt(10) + 3 }, () =>
            String.fromCharCode(randomInt(26) + 65)
        ).join("")
    ).join(" ");
}

function getRandomText() {
    const numberOfWords = randomInt(1,50);
    return Array.from({ length: numberOfWords }, () => getRandomName(1)).join(" ");
}

export const categories = [
    "Charity Event", "Concert", "Conference", "Convention", "Exhibition", "Festival",
    "Product Launch", "Sports Event"
]
export function getRandomCategory() {
    return categories[randomInt(categories.length)];
}

function getRandomTickets() {
    const numberOfTickets = randomInt(5);
    return Array.from({ length: numberOfTickets }, () => {
        return {
            "name": getRandomName(1),
            "quantity": randomInt(1,1000),
            "price": randomInt(1,100)
        }
    });
}

export async function sendRequest(endpoint, method, body, headers) {
    const address = `${SERVER_URL}${endpoint}`;
    const content = {
        method: method,
        headers: headers
    }
    if (body) {
        content['body'] = body
    }
    return await fetch(address, content);

}

export async function tryLogin(username, password) {
    const endpoint = "/api/login";
    const body = JSON.stringify({ username: username, password: password });
    const headers = { 'Content-Type': 'application/json' };
    const res = await sendRequest(endpoint, 'POST', body, headers);
    return res.status === 200 ? (await res.json()).token : null;
}

export async function trySignup(username, password) {
    const endpoint = "/api/signup";
    const body = JSON.stringify({ username: username, password: password });
    const headers = { 'Content-Type': 'application/json' };
    const res = await sendRequest(endpoint, 'POST', body, headers);
    return res.status === 200;
}

export async function updatePermissions(username, role) {
    const adminJwt = await tryLogin("admin", "admin");
    const endpoint = "/api/permissions";
    const body = JSON.stringify({ username: username, auth_level: role });
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminJwt };
    const res = await sendRequest(endpoint, 'PUT', body, headers);
    return res.status === 200;
}

export async function createEvent(event, token) {
    const endpoint = "/api/event";
    const body = JSON.stringify(event);
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
    const res = await sendRequest(endpoint, 'POST', body, headers);
    return res.status === 200 ? (await res.json())._id : null;

}

export function getRandomEvent(event = {}) {
    const { title, category, organizer } = event;
    return {
        "title": title || getRandomName(),
        "category": category || getRandomCategory(),
        "description": getRandomText(),
        "organizer": organizer || getRandomName(),
        "start_date": "2024-01-07T10:00",
        "end_date": "2024-01-07T19:00",
        "location": getRandomName(),
        "tickets": getRandomTickets(),
        "image": "https:images.thedirect.com/media/photos/comics-dc.jpg"
    }
}