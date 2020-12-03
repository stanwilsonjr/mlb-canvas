import "regenerator-runtime/runtime";

// Content call https://statsapi.mlb.com/api/v1/game/530376/content

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const   context = canvas.getContext("2d");

  // setting up dimensions object for calculating game box size
const dimensions = {
    width: 90,
    height: 50,
    highlightHeight: function () {
      return this.height * 1.5 + this.height;
    },
    highlightWidth: function () {
      return this.width * 1.5 + this.width;
    },
  };



let gamesList = "";
async function getGames(cb) {

  
  const today = new Date();

  /// Grab All games with Async Call
  const date = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const mlbGames = `https://statsapi.mlb.com/api/v1/schedule?hydrate=game(content(editorial(recap))),decisions&date=2019-06-10&sportId=1`;
  let response = await fetch(mlbGames);
  gamesList = await response.json();
  
  /// Grab all an image related to the game
  async function getContent(game) {
    const proxy = "https://cors-anywhere.herokuapp.com/";
    const gameDetailEndpoint = `${proxy}https://statsapi.mlb.com${game.content.link}`;
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

  //  Add image data to  original Games list  
  for (let i = 0; i < Content.length; i++) {
    const hasArticle = Content[i].summary.hasRecapArticle;
    gamesList.dates[0].games[i].photo = hasArticle
      ? Content[i].editorial.recap.mlb.photo.cuts[8].src
      : "none";
  }
  /// Call build Stack 
  cb(gamesList);
}

/// Async call to preload image
function loadImage(url) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.addEventListener("load", (e) => resolve(img));
    img.addEventListener("error", () => {
      reject(new Error(`Failed to load image's URL: ${url}`));
    });
    img.src =
      url === "none"
        ? "https://dodgerblue.com/wp-content/uploads/2020/03/mlb-logo.png"
        : url;
  });
}
const buildStack = async (data) => {
 
  /// Mapping games list to a variable 
  let gamesArr = data.dates[0].games;

  context.clearRect(0, 0, canvas.width, canvas.height);
  
  /// Determining highlight game
  const hightLightGame = Math.floor(gamesArr.length / 2 );

  /// Determining game after highlight game
  const PosthightLightGame = hightLightGame + 1;
  let xCoord = 0;
  let gap = 10;

  //  Preload images
  let promises = gamesArr.map((game) => loadImage(game.photo));
  let gameImgs = await Promise.all(promises);

  // Hide loader 
  document.querySelector("#loading-overlay").classList.add("hide-loader")

  // Reveal Games list
  document.querySelector("#canvas").classList.add("content-loaded")

  for (let c = 0; c < data.totalGames; c++) {
    const isFocused = c === hightLightGame ? true : false;
    const postHighlight = c === PosthightLightGame ? true : false;

    const width = isFocused ? dimensions.highlightWidth() : dimensions.width;
    const height = isFocused ? dimensions.highlightHeight() : dimensions.height;
    const alpha = isFocused ? 1 : 0.4;
    const yCoord = canvas.height / 2 - height / 2;

    let gamePhoto = gameImgs[c];
    
    // Adjust X Coordnate based on card size and placement 
    xCoord +=
      c == 0
        ? 0
        : postHighlight
        ? dimensions.highlightWidth() + gap
        : dimensions.width + gap;

    /// add backing rectangles, images and shadows with varying alpha levels
    context.fillStyle = "black";
    context.fillRect(xCoord, yCoord, width, height);
    context.globalAlpha = alpha;
    context.shadowColor = "rgba(0,0,0,0.5)";
    context.shadowBlur = 15;
    context.drawImage(gamePhoto, xCoord, yCoord, width, height);
    context.globalAlpha = 1;
    context.shadowBlur = 0;
    
    /// Setting color and x/y values for text 
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
  }
  context.restore();
};

/// get games then build game list  
window.onload = () => getGames(buildStack);
