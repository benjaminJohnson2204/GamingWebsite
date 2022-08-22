# Gaming Website

This is a website I created where users can play single-player and multi-player games. Users also become friends with each other and play private games with their friends, or play against random opponents. The website is hosted on Heroku at https://bens-gaming-website.herokuapp.com/.

## Tech Stack

I programmed this website using MongoDB, Express, React, Node, TypeScript, and Socket.IO. I used Typescript for both the client and server code.

## Running Instructions

To build the app, run

```
npm run build
```

To run the app, run

```
npm start
```

To run the tests, run

```
npm test
```

## Code Structure

I divided the code into client code and server code.

### Client

All the client code is in the `client` directory. This directory is a React app, and I used React-Router for client-side routing. `client/src/components` contains components I created for the site, and `client/src/pages` contains the various site pages.

### Database

The `db` directory contains code for interfacing with my MongoDB database using Mongoose. `db/models` contains definitions for my database models. For each model, I define an interface (for Typescript typing) and a schema, then a model.

In `db/models/document.ts`, the `IDocument` interface, which the model interfaces extend, contains the `_id` property since all MongoDB documents contain the `_id` field. Wherever this documentation says "ID", it refers to the `_id` field of a document.

In `db/models/friend.ts`, there are models for a friendship and a friend request. A friendship stores the IDs of the users that are friends, while a friend request stores which user is requesting the friendship and which user they are requesting to be their friend.

In `db/models/gameType.ts`, I define the game type model. I used "game type" to mean a game that can be played, such as Tic-Tac-Toe, Dots and Boxes, or Tetris. The game type document would contain data about how that game works. By contrast, I use "game" to mean a _specific_ game played by 2 users of a certain type, so a game document would store information about what users are playing and the game result. The game type model includes fields for the name of the game type, the namespace used when playing that game with sockets and for routing to that game type, a description of the game type, and how many players the game type is for.

In `db/models/game.ts`, I define the game model. This model contains fields for the type of the game, what user(s) is/are playing it and their usernames, whether the game is complete, who won (if the game is multiplayer) and the score (if the game is singleplayer).

In `db/models/user.ts`, I define the user model. This model simply stores a user's username and password (in reality, a hash of their password). This model is used to store users and data about their games by referring to a user by their ID.

### Server

`server/index.ts` is the main file that runs the server. The server is an Express app that serves API routes I've programmed, but also serves the client code on the website. The main components of the server are the API routes (in the `routes` directory) and the socket event handlers, in the `gameHandlers` directory.

### Server/Routes

#### Auth

On the `auth` route, there are endpoints to authenticate users. I used Passport and Bcrypt for user authentication, using local authentication. I used session authentication, so that once a user is authenticated, their future requests are also authenticated until they log out.

- `POST` requests to `auth/register` register a new user. The user must provide a username and password, and confirm their password.

- `POST` requests to `auth/login` log in a user. The user must provide their username and password.

- `POST` requests to `auth/logout` log out a user.

- `GET` requests to `auth/user` return the user's username and (hashed) password. This endpoint, as well as several others such as for friends and games, use the `ensureAuthenticated` middleware, which checks that a user is authenticated before allowing them to access the route.

- `GET` requests to `auth/invalid` signify that a user is not authenticated. Passport redirects requests to this endpoint if the authentication credentials are invalid.

- `DELETE` requests to `auth/delete` will delete a user's account.

#### Friends

The `friends` route contains endpoints to read and change a user's friends and friend requests.

- `GET` requests to `friends/all` will return all a user's friends.

- `GET` requests to `friends/search` search for a user by a search string, which is a query parameter. This route not only retrieves users whose usernames match the query, but also checks whether each matching user is already a friend of the requesting user, or whether a friend request has been made between them.

- `POST` requests to `friends/request` create a new friend request to another user, whose ID is stored in the request's body as `userId`.

- `GET` requests to `friends/request/incoming` will return all incoming friend requests to a user (i.e. all users who have sent friend requests to this user).

- `GET` requests to `friends/request/outgoing` will return all outgoing friend requests a user has made to other users.

- `POST` requests to `friends/accept` will accept a friend request from another user, whose ID is stored in the `userID` field of the request's body.

- `POST` requests to `friends/decline` will decline a friend request from another user, whose ID is stored in the `userID` field of the request's body.

- `POST` requests to `friends/cancel` will cancel a friend request the user has sent to another user, whose ID is stored in the `userID` field of the request's body.

- `POST` requests to `friends/remove` will remove a certain friend of the user, with the friend's ID stored in the `userID` field of the request's body.

#### Game Type

The `game-type` route contains endpoints to get data about game types.

- `GET` requests to `game-type/all` will return all existing game types.

- `GET` requests to `game-type/requests` will return all game requests other users have made to this user. Game requests are how users ask their friends to play private games.

- `GET` requests to `game-type/:gameType` will return data about a certain game type, with the parameter being the namespace of that game type.

#### Game

The `game` route contains endpoints to get view a user's past games and create new games.

- `GET` requests to `game/all` will return all games a user has played.

- `GET` requests to `game/dots-and-boxes/colors` will return all available colors for playing Dots and Boxes.

- `GET` requests to `game/:gameTypeId` will return all games a user has played of a certain game type by specifying the ID of that game type.

- `POST` requests to `game/add` will create a new game that the user has finished. This endpoint is only used for single-player games, because multi-player games automatically save to the database once they are finished as part of the server's socket event handling, while single-player games take place entirely in the client and are only saved to the database once they are finished.

### Server/GameHandlers

The `server/gameHandlers` directory contains code for managing sockets for multiplayer games. In `server/index.ts`, `globalWaitingRandomUsers` stores users that are waiting to play games against randomOpponents, `globalWaitingPrivateUsers` stores users that are waiting to play games against friends they've challenged, and `globalInProgressGames` stores games that are in progress. Each of these variables are maps, with keys being socket namespaces and values being the users/games that are of the game of that namespace. Each game type's handlers keep track of users and games by reading and writing to these variables.

`server/gameHandlers/types` contains type definitions for socket events between the client and server, and for the parameters that are passed to game handlers.

`server/gameHandlers/handleRooms` contains a handler for users to wait for opponents and join games. Each game type handler calls this handler since the joining process is the same for each game type; it's just the playing process that varies. Clients emit `joinRandomGame` events to join a game against a random opponent. The handler checks if any other users are waiting for random opponents, and if they are, it starts a game between the users; if not, it stores the requesting client as a waiting user. Clients emit `createPrivateGame` to create a private game, and the challenged opponent must emit `joinPrivateGame` to join the game and begin playing. The server tells clients that their game is starting by emitting a `joinedGame` event. When a user starts playing a game or disconnects, they are removed from the lists of waiting users.

`server/gameHandlers/dotsAndBoxes` contains the handler for playing Dots and Boxes. The code handles the game logic, and instantiates a game when users join it. Clients can emit `chooseColor` to choose their colors (the game stores each user's color, the color used to shade their claimed boxes). They can emit `move` to make a move in the game; when a user makes a move, the server emits `gameUpdate` with the updated game to tell the clients to re-render the game. The move handler also checks whether the game is over, in which case it updates the game in the database to be complete and marks who the winner is.

`server/gameHandlers/ticTacToe.ts` contains the handler for playing Tic-Tac-Toe. The events are identical to the Dots and Boxes handler, except a `chooseColor` event is not needed. The only real difference is that the logic of the games is different.

### Tests

The `tests` directory contains tests of the site's API routes. I used ChaiHttp to simulate HTTP requests, and MongoUnit to create a test database independent of my production database.
