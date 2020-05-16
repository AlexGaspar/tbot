const {installMouseHelper} = require('./install-mouse-helper');

const fs = require('fs');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhonex = devices['iPhone X'];

const proxyChain = require('proxy-chain');

const words = require('./words.json');

const CHANNEL_TO_WATCH = 'banzoun3t';
const USERS_DIR = './users_local/';

const isMacOs = (process.platform === 'darwin');

class Bot {
  constructor(settings) {
    let userSettings = settings.user_settings;

    this.name = userSettings.name;
    this.user_cookies = userSettings.cookies;
    this.user_agent = userSettings.ua;

    this.channel = settings.channel;

    this.should_talk = settings.should_talk;
    this.should_say_hello = settings.should_say_hello;
    this.should_follow = settings.should_follow;
    this.emoji_only = settings.emoji_only;

    this.page = null;
  }

  async run() {
    this.print("Starting Bot...");

    const oldProxyUrl = 'http://lum-customer-hl_37333bcd-zone-static-route_err-pass_dyn-country-fr:oax9gt70s19e@zproxy.lum-superproxy.io:22225';

    const newProxyUrl = await proxyChain.anonymizeProxy('http://glxhauom-AT-DE-ES-IE-NL-rotate:sz038gdmi2m2@p.webshare.io:80');


    var browserSettings = {
      headless: true,
      slowMo: 50,
      ignoreHTTPSErrors: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--disable-extensions',
        `--proxy-server=${newProxyUrl}`,
      ]
    };

    const browser = await puppeteer.launch(browserSettings);
    const page = this.page = await browser.newPage();
    await page.setCookie(...this.user_cookies);
    await page.setUserAgent(this.user_agent);
    // await page.authenticate({ username: '', password: ''});

    // await installMouseHelper(page);

    page.setViewport({width: 1800, height: 1400});

    try {
      await page.goto(`https://twitch.tv/${this.channel}`);
    } catch (e) {
      this.print('Cannot navigate to Twitch.');
      await browser.close();
      return;
    }
    // await page.goto('https://luminati.io');
    // await page.goto('https://marker.io');

    await page.screenshot({ path: 'screenshots/last.png' });

    await this.acceptStuffBeforeLaunchingStream();
    await this.unmuteSream();

    if (this.should_follow) {
      const followSelector = 'button[data-a-target="follow-button"]';
      const buttonFollowSelector = await page.$(followSelector);
      if (buttonFollowSelector !== null) await page.click(followSelector);
    }

    this.print('Starting chatting & movements...');

    this.startTakingScreenShots();
    this.startDoingRandomStuff();
    this.startCollectingChannelPoint();

    await this.startTalkingIfEnabled();
  }


  /* Points */

  startCollectingChannelPoint() {
    const page = this.page;

  }


  /* ScreenShots */

  startTakingScreenShots() {
    const page = this.page;

    this.runEveryXMinutes(
       async () => {
        await page.screenshot({ path: `screenshots/last-${this.name}.png` });
        this.print('Screenshot saved.')
       },
       1
    );
  }

  /* Mouse */

  startDoingRandomStuff() {
    const page = this.page;
    this.loopRandomly(
      async () => {
        if (!this.should_talk) {
          // Start typing but don't send
          await this.talk(words.emoji, false);
        }

        let rand = this.getNumberBetween(0, 4);
        if (rand === 1) {
          const openTheaterSelector = 'button[data-a-target="player-theatre-mode-button"]';
          const buttonOpenTheater = await page.$(openTheaterSelector);
          if (buttonOpenTheater !== null) await page.click(openTheaterSelector);
        }

        this.print('Moving mouse...');
        await page.mouse.move(this.getRandomInt(1000), this.getRandomInt(1000));
        await page.mouse.move(this.getRandomInt(1000), this.getRandomInt(1000));
        await page.mouse.move(this.getRandomInt(1000), this.getRandomInt(1000));
        await page.waitFor(this.getRandomInt(2)*1000);
        this.print('Moving mouse done.')
      }
    );
  }

  /* Chat */

  async startTalkingIfEnabled() {
    if (this.should_say_hello) {
      await this.talk(words.hello);
    }

    if (this.should_talk) {
      this.loopRandomlyLonger(
          async () => {
            await this.talk(this.emoji_only ? words.emoji : words.all);
          }
      );
    }
  }

  async talk(dict, should_submit) {
    const page = this.page;
    const chatButton = 'button[data-a-target="chat-send-button"]';
    const chatSelector = 'textarea[data-a-target="chat-input"]';
    let rand = this.getNumberBetween(0, dict.length - 1);

    if (await page.$(chatSelector) !== null) {
      await page.focus(chatSelector);
      await this.clearCurrentInput();
      await page.keyboard.type(dict[rand] + ' ');

      if (should_submit !== false) await page.click(chatButton);
    } else {
      this.print("Can't find the chat");
    }
  }

  /* Helpers */

  async acceptStuffBeforeLaunchingStream() {
    const page = this.page

    const buttonSelector = 'button[data-a-target="consent-banner-accept"]';
    const buttonConsent = await page.$(buttonSelector);
    if (buttonConsent !== null) await page.click(buttonSelector);

    const openNormaView = 'a[data-a-target="home-live-overlay-button"]';
    const buttonOpenNormalView = await page.$(openNormaView);
    if (buttonOpenNormalView !== null) await page.click(openNormaView);

    const acceptMatureStream = 'button[data-a-target="player-overlay-mature-accept"]';
    const buttonAcceptMatureStream = await page.$(acceptMatureStream);
    if (buttonAcceptMatureStream !== null) await page.click(acceptMatureStream);
  }

  async unmuteSream() {
    const page = this.page

    const muteButtonSelector = 'button[data-a-target="player-mute-unmute-button"]';
    let muteButton = await page.$(muteButtonSelector);
    if (muteButton !== null) {
      let label = await muteButton.evaluate(el => el.getAttribute('aria-label'))

      if (!label.includes('Mute (m)')) {
        this.print(`Unmuting stream... (label: ${label})`);
        await page.keyboard.press('m');
        muteButton = await page.$(muteButtonSelector);
        label = await muteButton.evaluate(el => el.getAttribute('aria-label'))
        this.print(`Unmuting stream done. (label: ${label})`);
      }
    }
  }

  print(message) {
    console.log('[' + this.name + '] --> ' + message);
  }

  loopRandomly(async_func) {
    var rand = this.getNumberBetween(20, 60);
    setTimeout(async () => {
      await async_func();
      this.loopRandomly(async_func);
    }, rand * 1000);
  }

  async clearCurrentInput() {
    const page = this.page;

    await page.keyboard.press('Home');
    await page.keyboard.down('Shift');
    await page.keyboard.press('End');
    await page.keyboard.up('Shift');
    await page.keyboard.press('Backspace');
  }

  runEveryXMinutes(async_func, multiplier) {
    multiplier = multiplier || 1;

    setTimeout(async () => {
      await async_func();
      this.runEveryXMinutes(async_func, multiplier);
    }, 60 * 1000 * multiplier);
  }

  loopRandomlyLonger(async_func) {
    var rand = this.getNumberBetween(3 * 60, 10 * 60);
    this.print('next message in: ' + rand);
    setTimeout(async () => {
      await async_func();
      this.loopRandomlyLonger(async_func);
    }, rand * 1000);
  }

  getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  getNumberBetween(min, max) {
    return Math.floor(
      Math.random() * (max - min) + min
    )
  }
}

const args = process.argv.slice(2);

fs.readdir(USERS_DIR, (err, files) => {
  for (let i = 0; i < files.length; i++) {
    setTimeout(async () => {
      let bot = new Bot({
        user_settings: require('./' + USERS_DIR + '/' + files[i]),
        channel: CHANNEL_TO_WATCH,
        should_follow: true,
        should_say_hello: true,
        emoji_only: true,
        should_talk: false,
      });

      await bot.run();
    }, i * 30000);
  }
});


// Tries a few logout bots
// for (let i = 0; i < 5; i++) {
//   setTimeout(async () => {
//     let bot = new Bot({
//       user_settings: {
//         name: `LogOut-${i}`,
//         ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/535.26 (KHTML, like Gecko) Chrome/81.0.4040.125 Safari/537.25",
//         cookies: [],
//       },
//       channel: CHANNEL_TO_WATCH,
//       should_follow: false,
//       should_say_hello: false,
//       emoji_only: false,
//       should_talk: false,
//     });

//     await bot.run();
//   }, i * 4000);
// }

// Keep the script alive
new Promise(_ => null)
