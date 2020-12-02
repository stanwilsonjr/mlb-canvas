import "regenerator-runtime/runtime";

// Content call https://statsapi.mlb.com/api/v1/game/530376/content

const canvas = document.getElementById("canvas"),
  context = canvas.getContext("2d"),
  dimensions = {
    width: 90,
    height: 50,
    highlightHeight: function () {
      return this.height * 1.5 + this.height;
    },
    highlightWidth: function () {
      return this.width * 1.5 + this.width;
    },
  },
  endPoint = 0;
let offSet = 0 / 2;

const placeholderImg = document.getElementById("image_01");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gamesList = "";
async function getGames(cb) {
  const today = new Date();
  const proxy = "https://cors-anywhere.herokuapp.com/";
  const date = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const mlbGames = `https://statsapi.mlb.com/api/v1/schedule?hydrate=game(content(editorial(recap))),decisions&date=2019-06-10&sportId=1`;
  let response = await fetch(mlbGames);
  gamesList = await response.json();
  async function getContent(game) {
    const gameDetailEndpoint = `${proxy}https://statsapi.mlb.com${game.content.link}`;
    console.log(gameDetailEndpoint);
    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Accept", "application/json");
    const response = await fetch(gameDetailEndpoint, {
      method: "GET",
      headers: headers,
    });
    const GameDetails = await response.json();

    return GameDetails;
  }

  let Content = await Promise.all(
    gamesList.dates[0].games.map((g) => getContent(g))
  );
  console.log(Content);
  for (let i = 0; i < Content.length; i++) {
    const hasArticle = Content[i].summary.hasRecapArticle;
    gamesList.dates[0].games[i].photo = hasArticle
      ? Content[i].editorial.recap.mlb.photo.cuts[8].src
      : "none";
  }

  cb(gamesList);
}
function loadImage(url) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.addEventListener("load", (e) => resolve(img));
    img.addEventListener("error", () => {
      reject(new Error(`Failed to load image's URL: ${url}`));
    });
    img.src = url;
  });
}
const animateStack = (data) => {
  // console.log(data);

  let gamesArr = data.dates[0].games;
  // Update arrays to move the last 6 object to the front so that the original front
  context.clearRect(0, 0, canvas.width, canvas.height);

  const hightLightGame = 3;
  const PosthightLightGame = hightLightGame + 1;
  let xCoord = 0;
  let gap = 10;
  for (let c = 0; c < data.totalGames; c++) {
    const isFocused = c === hightLightGame ? true : false;
    const postHighlight = c === PosthightLightGame ? true : false;

    const width = isFocused ? dimensions.highlightWidth() : dimensions.width;
    const height = isFocused ? dimensions.highlightHeight() : dimensions.height;
    const alpha = isFocused ? 1 : 0.4;
    const yCoord = canvas.height / 2 - height / 2;



     let gameImg = (gamesArr[c].photo !== "none")? gamesArr[c].photo : 'https://dodgerblue.com/wp-content/uploads/2020/03/mlb-logo.png';
    loadImage(gameImg).then((gamePhoto) => {
      xCoord +=
      c == 0
        ? offSet
        : postHighlight
        ? dimensions.highlightWidth() + gap
        : dimensions.width + gap;
        context.fillStyle = isFocused ? "pink" : "black";
        context.fillRect(xCoord, yCoord, width, height);
        context.globalAlpha = alpha;
        context.shadowColor = "rgba(0,0,0,0.5)";
        context.shadowBlur = 15;
        context.drawImage(gamePhoto, xCoord, yCoord, width, height);
        console.log("image loaded",xCoord);
        console.log("after");
        context.globalAlpha = 1;
        context.shadowBlur = 0;

        context.fillStyle = "white";
        context.font = isFocused ? "15px sans-serif" : "7px sans-serif";
        const firstLineHeight = isFocused ? height + 20 : height + 10;
        const secondLineHeight = isFocused ? height + 40 : height + 20;
        context.fillText(
          `${gamesArr[c].teams.away.team.name} at`,
          xCoord,
          yCoord + firstLineHeight
        );
        context.fillText(
          `${gamesArr[c].teams.home.team.name}`,
          xCoord,
          yCoord + secondLineHeight
        );

        context.save();
      });
    }
  //}
  //offSet -= 10;
  // if( Math.abs(offSet) > 0 ){
  // 	requestAnimationFrame(animateStack);
  // }
  context.restore();
};

window.onload = () => getGames(animateStack);
