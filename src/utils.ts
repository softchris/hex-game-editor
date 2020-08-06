export const randomNumber = (limit) => {
  let rand = Math.random() * limit;
  return Math.floor(rand);
};

const logEl = document.querySelector(".menu");
const infoEl = document.querySelector(".info");

export function getRandomType() {
  const no = randomNumber(4);
  switch (no) {
    case 0:
      return "Wood";
    case 1:
      return "Water";
    case 2:
      return "Desert";
    default:
      return "Clay";
  }
}

export function toolTip(message) {
  if(infoEl) {
    infoEl.innerHTML = message;
  }
}

export function log(message) {
  if (logEl) {
    logEl.innerHTML = logEl?.innerHTML + "<br />" + message;
  }
}

export function isInList(hex, selected) {
  const { x, y } = hex;
  if (selected.length === 0) {
    return false;
  }

  for (let i = 0; i < selected.length; i++) {
    let sel = selected[i];
    if (sel.x === x && sel.y === y) {
      return true;
    }
  }

  return false;
}

export function isHexInList(hex, list: Array<any>) {
  for(let i =0; i < list.length; i++) {
    if( list[i].x === hex.x && list[i].y === hex.y) {
      return true;
    }
  }
  return false;
}

export function isGameCursor(hex, gameCursor) {
  return gameCursor.x === hex.x && gameCursor.y === hex.y;
}

export function getInfoTileFromHex(hex, list: Array<any>) {
  for(var i=0; i< list.length; i++) {
    const item = list[i];
    if (hex.x === item.x && hex.y === item.y) {
      return item;
    }
  }
  return null;
}