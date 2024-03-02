
import assert from 'assert';
import { v4 as uuidv4 } from "uuid";
import { categories, sleep, sendRequest, tryLogin, trySignup, createEvent, updatePermissions, SERVER_URL, getRandomCategory, getRandomEvent } from "./test_utils.js";
export class Tests {
    constructor() {
        console.log("Running tests against " + SERVER_URL);
        this.username = "testuser" + uuidv4();
        this.password = "testpassword";
        this.managerUsername = "manager";
        this.managerPassword = "manager";
    }
    async setup() {
        await trySignup(this.username, this.password);
        await updatePermissions(this.username, "W");
        await trySignup(this.managerUsername, this.managerPassword);
        await updatePermissions(this.managerUsername, "M");
        this.userToken = await tryLogin(this.username, this.password);
        this.managerToken = await tryLogin(this.managerUsername, this.managerPassword);
        this.adminToken = await tryLogin("admin", "admin");
        assert(this.userToken !== null, "User login failed");
        assert(this.managerToken !== null, "Manager login failed");
        assert(this.adminToken !== null, "Admin login failed");
    }

    async testUserSignupAndLogin() {
        const username = "testuser" + uuidv4();
        const password = "testpassword";
        const signupEndpoint = "/api/signup";
        const signupBody = JSON.stringify({ username: username, password: password });
        const signupHeaders = { 'Content-Type': 'application/json' };
        const signupRes = await sendRequest(signupEndpoint, 'POST', signupBody, signupHeaders);
        assert(signupRes.status === 200, "User signup failed: " + signupRes.status);
        const loginEndpoint = "/api/login";
        const loginBody = JSON.stringify({ username: username, password: password });
        const loginHeaders = { 'Content-Type': 'application/json' };
        const loginRes = await sendRequest(loginEndpoint, 'POST', loginBody, loginHeaders)
        assert(loginRes.status === 200, "User login failed: " + loginRes.status);
    }

    async testSignupWithExistingUser() {
        const endpoint = "/api/signup";
        const body = JSON.stringify({ username: this.username, password: this.password });
        const headers = { 'Content-Type': 'application/json' };
        const res = await sendRequest(endpoint, 'POST', body, headers);
        assert(res.status === 400, "Signup with existing user succeeded");
    }

    async testIncorrectLoginCredentials() {
        // Attempt login with incorrect credentials and expect a 401 Unauthorized response
        const endpoint = "/api/login";
        const body = JSON.stringify({ username: this.username, password: "wrongpassword" });
        const headers = { 'Content-Type': 'application/json' };
        const res = await sendRequest(endpoint, 'POST', body, headers);
        assert(res.status === 401, "Incorrect login credentials succeeded");
    }

    async testManagerCreatesEvent() {
        const eventId = await createEvent(getRandomEvent(), this.managerToken);
        assert(eventId !== null, "Manager event creation failed");
    }

    async testAdminCreatesEvent() {
        const event = getRandomEvent();
        const endpoint = "/api/event";
        const body = JSON.stringify(event);
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.adminToken };
        const res = await sendRequest(endpoint, 'POST', body, headers);
        assert(res.status === 200, "Event creation failed: " + res.status + " " + res.statusText);
        const eventResponse = await res.json();
        assert(Object.keys(eventResponse).length === 1, "Event creation failed: " + JSON.stringify(eventResponse));
        assert(eventResponse.hasOwnProperty("_id"), "Event creation failed: " + JSON.stringify(eventResponse));
    }

    async testAdminUpdatesEvent() {
        const eventId = await createEvent(getRandomEvent(), this.adminToken);
        const updatedEvent = {
            title: "Updated Event",
        }
        const endpoint = "/api/event/" + eventId;
        const body = JSON.stringify(updatedEvent);
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.adminToken };
        const res = await sendRequest(endpoint, 'PUT', body, headers);
        assert(res.status === 200, "Admin event update failed");
        const resJson = await res.json();
        assert(Object.keys(resJson).length === 1, "Admin event update failed: " + JSON.stringify(resJson));
        assert(resJson.hasOwnProperty("_id"), "Admin event update failed: " + JSON.stringify(resJson));
        assert(resJson._id === eventId, "Admin event update failed: " + JSON.stringify(resJson));
        const updatedEventResponse = await sendRequest(endpoint, 'GET', null, headers);
        const updatedEventJson = await updatedEventResponse.json();
        assert(updatedEventJson._id === eventId, "Event creation failed: " + JSON.stringify(updatedEventJson));
        assert(updatedEventJson.title === updatedEvent.title, "Admin event update failed");
    }

    async testManagerUpdatesEvent() {
        // Ensure manager can update an event, use assert to check the response
        const eventId = await createEvent(getRandomEvent(), this.managerToken);
        const updatedEvent = {
            title: "Updated Event",
        }
        const endpoint = "/api/event/" + eventId;
        const body = JSON.stringify(updatedEvent);
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.managerToken };
        const res = await sendRequest(endpoint, 'PUT', body, headers);
        assert(res.status === 200, "Manager event update failed");
        const updatedEventResponse = await sendRequest(endpoint, 'GET', null, headers);
        const updatedEventJson = await updatedEventResponse.json();
        assert(updatedEventJson.title === updatedEvent.title, "Manager event update failed");
    }

    async testUserCannotUpdateEvent() {
        // Attempt to update an event with worker credentials and expect failure
        const eventId = await createEvent(getRandomEvent(), this.adminToken);
        const updatedEvent = {
            title: "Updated Event",
        }
        const endpoint = "/api/event/" + eventId;
        const body = JSON.stringify(updatedEvent);
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.userToken };
        const res = await sendRequest(endpoint, 'PUT', body, headers);
        assert(res.status === 403, "User event update succeeded: " + res.status);
    }

    async testWorkerCannotCreateEvent() {
        // Attempt to create an event with worker credentials and expect failure
        const eventId = await createEvent(getRandomEvent(), this.userToken);
        assert(eventId === null, "Worker event creation succeeded: " + eventId);
    }

    async testDeleteEvent() {
        // Create an event, then delete it, and verify it's no longer accessible
        const eventId = await createEvent(getRandomEvent(), this.adminToken);
        const endpoint = "/api/event/" + eventId;
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.adminToken };
        const getEventResponse = await sendRequest(endpoint, 'GET', null, headers);
        assert(getEventResponse.status === 200, "Event creation failed: " + getEventResponse.status + " " + getEventResponse.statusText);
        const res = await sendRequest(endpoint, 'DELETE', null, headers);
        assert(res.status === 200, "Event deletion failed");
        const resJson = await res.json();
        assert(Object.keys(resJson).length === 0, "Event deletion failed: " + JSON.stringify(resJson));
        const deletedEventResponse = await sendRequest(endpoint, 'GET', null, headers);
        assert(deletedEventResponse.status === 404, "Event deletion failed");
    }

    async testUserCannotDeleteEvent() {
        // Create an event, then attempt to delete it with worker credentials and expect failure
        const eventId = await createEvent(getRandomEvent(), this.adminToken);
        const endpoint = "/api/event/" + eventId;
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.userToken };
        const res = await sendRequest(endpoint, 'DELETE', null, headers);
        assert(res.status === 403, "User event deletion succeeded: " + res.status);
    }

    async testManagerCannotDeleteEvent() {
        // Create an event, then attempt to delete it with manager credentials and expect failure
        const eventId = await createEvent(getRandomEvent(), this.adminToken);
        const endpoint = "/api/event/" + eventId;
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.managerToken };
        const res = await sendRequest(endpoint, 'DELETE', null, headers);
        assert(res.status === 403, "Manager event deletion succeeded: " + res.status);
    }

    async testRetrieveEvent() {
        // Create an event, then attempt to retrieve it and verify the details
        const event = getRandomEvent();
        const eventId = await createEvent(event, this.adminToken);
        const endpoint = "/api/event/" + eventId;
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.userToken };
        const res = await sendRequest(endpoint, 'GET', null, headers);
        assert(res.status === 200, "Event retrieval failed");
        const retrievedEvent = await res.json();
        assert(retrievedEvent.title === event.title, "Event retrieval failed");
    }

    async testRetrieveNonExistentEvent() {
        // Attempt to retrieve a non-existent event and expect a 404 Not Found response
        const endpoint = "/api/event/123456789";
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.userToken };
        const res = await sendRequest(endpoint, 'GET', null, headers);
        assert(res.status === 404, "Retrieving non-existent event succeeded");
    }

    async testCategoryFilter() {
        // Create an event, then attempt to retrieve it and verify the details
        const category = getRandomCategory();
        for (let i = 0; i < 10; i++) {
            await createEvent(getRandomEvent({ category: category }), this.adminToken);
        }
        const endpoint = "/api/event/" + category;
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.userToken };
        const res = await sendRequest(endpoint, 'GET', null, headers);
        assert(res.status === 200, "Event retrieval failed: " + res.status);
        const events = await res.json();
        assert(events.length >= 10, "Event retrieval failed: number of events is too low (" + events.length + ")");
    }

    async testAllCategories() {
        categories.forEach(async (category) => {
            const endpoint = "/api/event/" + category;
            const headers = { 'Content-Type': 'application', 'Authorization': 'Bearer ' + this.userToken };
            const res = await sendRequest(endpoint, 'GET', null, headers);
            assert(res.status === 200, "Event retrieval failed: " + res.status);
        });
    }

    async testNonExistingCategory() {
        const endpoint = "/api/event/nonexistentcategory";
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.userToken };
        const res = await sendRequest(endpoint, 'GET', null, headers);
        assert(res.status === 404, "Retrieving non-existent category succeeded");
    }

    async testCategorySkipAndLimit() {
        const category = getRandomCategory();
        for (let i = 0; i < 50; i++) {
            await createEvent(getRandomEvent({ category: category }), this.adminToken);
        }
        const endpoint = "/api/event/" + category;
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.userToken };
        const res = await sendRequest(endpoint, 'GET', null, headers);
        assert(res.status === 200, "Event retrieval failed: " + res.status);
        const events = await res.json();
        assert(events.length === 50, "Event retrieval failed: number of events is incorrect (" + events.length + ")");
        for (let i = 0; i < 5; i++) {
            const skip = i * 10;
            const limit = 10;
            const res = await sendRequest(endpoint + "?skip=" + skip + "&limit=" + limit, 'GET', null, headers);
            assert(res.status === 200, "Event retrieval failed: " + res.status);
            const partialEvents = await res.json();
            const expectedEvents = events.slice(skip, skip + limit);
            assert(partialEvents.length === 10, "Event retrieval failed: number of events is incorrect (" + partialEvents.length + ")");
            assert(partialEvents.every((event, index) =>  event._id === expectedEvents[index]._id), "Event retrieval failed: incorrect events returned");
        }
    }

    async testOrginzerFilter() {
        const organizer = "testorganizer" + uuidv4();
        for (let i = 0; i < 10; i++) {
            await createEvent(getRandomEvent({ organizer: organizer }), this.adminToken);
        }
        const endpoint = "/api/event/organizer/" + organizer;
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.userToken };
        const res = await sendRequest(endpoint, 'GET', null, headers);
        assert(res.status === 200, "Event retrieval failed: " + res.status);
        const events = await res.json();
        assert(events.length >= 10, "Event retrieval failed: number of events is too low (" + events.length + ")");
    }

    async testNonExistingOrganizer() {
        const endpoint = "/api/event/organizer/nonexistentorganizer";
        const headers = { 'Content-Type': 'application', 'Authorization': 'Bearer ' + this.userToken };
        const res = await sendRequest(endpoint, 'GET', null, headers);
        assert(res.status === 404, "Retrieving non-existent organizer succeeded: " + res.status);
    }

    async testOrganizerSkipAndLimit() {
        const organizer = "testorganizer" + uuidv4();
        for (let i = 0; i < 50; i++) {
            await createEvent(getRandomEvent({ organizer: organizer }), this.adminToken);
        }
        const endpoint = "/api/event/organizer/" + organizer;
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.userToken };
        const res = await sendRequest(endpoint, 'GET', null, headers);
        assert(res.status === 200, "Event retrieval failed: " + res.status);
        const events = await res.json();
        assert(events.length === 50, "Event retrieval failed: number of events is incorrect (" + events.length + ")");
        for (let i = 0; i < 5; i++) {
            const skip = i * 10;
            const limit = 10;
            const res = await sendRequest(endpoint + "?skip=" + skip + "&limit=" + limit, 'GET', null, headers);
            assert(res.status === 200, "Event retrieval failed: " + res.status);
            const partialEvents = await res.json();
            const expectedEvents = events.slice(skip, skip + limit);
            assert(partialEvents.length === 10, "Event retrieval failed: number of events is incorrect (" + partialEvents.length + ")");
            assert(partialEvents.every((event, index) =>  event._id === expectedEvents[index]._id), "Event retrieval failed: incorrect events returned");
        }
    }

    async testCreateEventWithId() {
        const eventId = uuidv4();
        const event = { _id: eventId, ...getRandomEvent()};
        const endpoint = "/api/event";
        const body = JSON.stringify(event);
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.adminToken };
        const res = await sendRequest(endpoint, 'POST', body, headers);
        assert(res.status === 400, "Event creation with ID succeeded: " + res.status);
    }
}
