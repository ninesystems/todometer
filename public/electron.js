const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  powerMonitor,
  shell,
  Tray,
    systemPreferences,
    nativeImage,
  Notification, screen
} = require("electron");
const Store = require("electron-store");
const isDev = require("electron-is-dev");
const Positioner = require('electron-positioner');
let winBlur = false;

const path = require("path");
const { version } = require("../package.json");

const store = new Store();

global.notificationSettings = {
  resetNotification: store.get("reset") || true,
  reminderNotification: store.get("reminder") || "hour"
};

let mainWindow = {
  show: () => {
    console.log("show");
  }
}; // temp object while app loads
let willQuit = false;

function createWindow() {
  const { screen } = require('electron')

  // Create a window that fills the screen's available work area.
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize;

  const color = systemPreferences.getAccentColor();
  console.log(color, "color");

  mainWindow = new BrowserWindow({
    width: 400,
    minWidth: 400,
    height: height,
    frame: false,
    show: false,
    skipTaskbar: true,
    titleBarStyle: 'hidden',
    transparent: true,
    backgroundColor: `#${color}`,
    icon: path.join(__dirname, "assets/png/128x128.png"),
    webPreferences: {
      nodeIntegration: true
    }
  });

  let positioner = new Positioner(mainWindow);
  positioner.move('topRight');

  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
}

// Create a menu when clicked ity will show window, or it would hide the window when click outside
function makeTrayMenu(){
  const image = nativeImage.createFromPath(isDev?`${path.join(__dirname, "./logo128.png")}`:
      `${path.join(__dirname, "../build/logo128.png")}`
  );
  let tray  = new Tray(image.resize({ width: 16, height: 16 }));
  tray.on('click', function(e){
    if (!mainWindow.isVisible() & winBlur == false) {
      mainWindow.show()
    }else {
      mainWindow.hide()
    }
  });
}

app.on('browser-window-blur', (event, win) => {
    winBlur = true;
    mainWindow.hide();
    const intID = setInterval(()=>{
        winBlur = false;
        clearInterval(intID);
    }, 500)
})


app.on("ready", () => {
  createWindow();
  makeTrayMenu();
  // dont need menu so commenting out
  //menuSetup();

  powerMonitor.on("resume", () => {
    mainWindow.reload();
  });

  // On Mac, this will hide the window
  // On Windows, the app will close and quit
  mainWindow.on("close", e => {
    if (willQuit || process.platform === "win32") {
      mainWindow = null;
      app.quit();
    } else {
      e.preventDefault();
      mainWindow.hide();
    }
  });
});

app.on("activate", () => mainWindow.show());
app.on("before-quit", () => (willQuit = true));
