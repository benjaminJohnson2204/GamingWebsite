import path from "path";
import express from "express";
const app = express();
const port = process.env.PORT || 3001;

app.use(express.static(path.resolve(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
