
# HW3 Template

This repo contain a project template for your HW3 task.

You are getting, "out of the box":
* Node server with Typescript
* API routing tample
* dev, build and start script
* Authantication with JWT example

## How to start?
* you can download/clone the project.
* update `package.json` file: name & author.
* create a new repo for your project.

## How to work with it?
You need to run `npm run {command}`. The command needs to be one of the following:

(go to the `package.json` file)
* `dev` -  run tsc on watch mode, and start the server compiled file. Great for developing.
* `build` - run tsc.
* `start` - run the compiled server file.

## About the dependecies
First, we are recommend that you will read more about each of those npm modules.

* `bcrypt` - for hash passwords & compare the hashed strings. By  defualt, hash with salt. Check the comments in `src/auth.ts`
* `jsonwebtoken` - for creating JWT. you can create & verify. Notice! you need to create a secret for sign the token.
* `uuid` - create random UUID.

You also need to install, by yourself, `mongoose`. Check https://github.com/pws236369/lecture-7-node-and-db for more about DB.
