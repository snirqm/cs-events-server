import { IncomingMessage, ServerResponse } from "http";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { ValueOrError, isError } from "./const.js";
import { User } from "./db.js";
import { responseError, responseSuccess } from "./response.js";
import { routeWithData } from "./request.js";
import { validatePermissions, validateUser } from "./schema.js";

// TODO: You need to config SERCRET_KEY in render.com dashboard, under Environment section.
const secretKey = process.env.SECRET_KEY || "your_secret_key";
export const validatePermissionLevel = async (user: { id: string }, permission: string) => {
   return User.findOne({ _id: user.id })
    .then((user) => {
      return user.auth_level >= getAuthLevel(permission);
    })
}
const isAdmin: (user: any) => Promise<boolean> = (user) => {
  return User.findOne({ _id: user.id })
    .then((user) => {
      return user.username === "admin";
    })
    .catch((err) => {
      console.error("Failed to find user: ", err);
      return false
    });
}

// Verify JWT token
const verifyJWT = (token: string) => {
  try {
    return jwt.verify(token, secretKey);
    // Read more here: https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    // Read about the diffrence between jwt.verify and jwt.decode.
  } catch (err) {
    return false;
  }
};


const validateAuthHeader = (authHeader: string) => {
  // authorization header needs to look
  // like that
  // Bearer <JWT>
  const authHeaderSplited = authHeader.split(" ");
  if (authHeaderSplited.length !== 2) {
    return false;
  }
  if (authHeaderSplited[0] !== "Bearer") {
    return false;
  }
  return true;
}

// Middelware for all protected routes. You need to expend it, implement premissions and handle with errors.
export const protectedRoute: (req: IncomingMessage, res: ServerResponse) => ValueOrError<{ id: string }> = (req, res) => {
  let authHeader = req.headers["authorization"] as string;
  if (!authHeader) {
    return responseError(res, 401, "No token provided.");
  }

  if (!validateAuthHeader(authHeader)) {
    return responseError(res, 401, "Invalid token provided.");
  }

  let authHeaderSplited = authHeader && authHeader.split(" ");
  const token = authHeaderSplited && authHeaderSplited[1];

  if (!token) {
    return responseError(res, 401, "No token provided.");
  }

  // Verify JWT token
  const user = verifyJWT(token);
  if (!user) {
    return responseError(res, 401, "Failed to authenticate token.");
  }

  // We are good!
  return {value: user}
};


const onLoginUserMatch = async (user: { id: string, password: string }, credentials: { password: string }, res: ServerResponse) => {
  // bcrypt.hash create single string with all the informatin of the password hash and salt.
  // Read more here: https://en.wikipedia.org/wiki/Bcrypt
  // Compare password hash & salt.
  const passwordMatch = await bcrypt.compare(
    credentials.password,
    user.password
  );
  if (!passwordMatch) {
    return responseError(res, 401, "Invalid username or password.");
  }

  // Create JWT token.
  // This token contain the userId in the data section.
  const token = jwt.sign({ id: user.id }, secretKey, {
    expiresIn: 86400, // expires in 24 hours
  });

  responseSuccess(res, 200, { token: token });

}


export const loginRoute = (req: IncomingMessage, res: ServerResponse) => {
  // Read request body.
  const data = { 'body': "" }
  routeWithData(req, res, data, async () => {
    if (res.statusCode === 400) { return; }
    const { value: credentials, error } = validateUser(JSON.parse(data.body))
    
    if (error) {
      console.log("error: ", error);
      return responseError(res, 400, "Bad request: " + error.details[0].message);
    }
    // Check if username and password match
    User.findOne({ username: credentials.username }, async (err, user) => {
      if (err) {
        console.error("Failed to find user: ", err);
        return responseError(res, 500, "Failed to find user.");
      }
      if (!user) {
        return responseError(res, 401, "Invalid username or password.");
      }
      onLoginUserMatch(user, credentials, res);
    })
  });
};

const getAuthLevel = (auth_level: string) => {
  switch (auth_level) {
    case "W":
      return 1;
    case "M":
      return 2;
    case "A":
      return 3;
    default:
      return null;
  }
}

export const permissionsRoute = (req: IncomingMessage, res: ServerResponse) => {
  const data = { 'body': "" };
  routeWithData(req, res, data, async () => {
    const user = protectedRoute(req, res);
    console.debug("user: ", user);
    if (isError(user)) {
      return;
    }
    if (!(await isAdmin(user.value))) {
      return responseError(res, 403, "You are not authorized to change permissions.");
    }
    const { value: premissions, error } = validatePermissions(JSON.parse(data.body));
    if (error) {
      return responseError(res, 400, "Bad request: " + error.details[0].message);
    }
    const username = premissions.username;
    if (username === "admin") {
      return responseError(res, 400, "You can't change admin permissions.");
    }
    const auth_level = getAuthLevel(premissions.auth_level);
    if (auth_level === null || auth_level === 3) {
      return responseError(res, 400, "Bad request.");
    }
    User.findOneAndUpdate({ username: username }, { auth_level: auth_level }, (err, user) => {
      if (err) {
        console.error("Failed to update user: ", err);
        return responseError(res, 500, "Failed to update user.");
      }
      if (user === null) {
        return responseError(res, 404, "User not found.");
      }
      console.debug("User permissions updated: ", user, " to ", auth_level);
      responseSuccess(res, 200, { message: "User updated successfully." });
    });
  });
}
export const signupRoute = async (req: IncomingMessage, res: ServerResponse) => {
  const data = { 'body': "" };
  routeWithData(req, res, data, async () => {
    if (res.statusCode === 400) { return; }
    const { value: credentials, error } = validateUser(JSON.parse(data.body));
    if (error) {
      return responseError(res, 400, "Bad request: " + error.details[0].message);
    }
    const username = credentials.username;
    const password = await bcrypt.hash(credentials.password, 10);
    const newUser = new User({ username, password, auth_level: 1 });
    User.findOne({ username: username }, async (err, user) => {
      if (user !== null) {
        return responseError(res, 400, "Username already exists.");
      }
      newUser.save((err, newUser) => {
        if (err) {
          console.error("Failed to create new user: ", err);
          return responseError(res, 500, "Failed to create new user.");
        }
        console.log("New user created: ", newUser);
        responseSuccess(res, 200, { username: newUser.username });
      });

    });
  });
};
